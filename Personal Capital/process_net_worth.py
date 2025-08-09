#!/usr/bin/env python3
"""
Net Worth Analysis Script
Processes Personal Capital Net Worth CSV export into monthly digest format.

Generated: {timestamp}
"""

import pandas as pd
import numpy as np
from datetime import datetime
import re
import sys
import os

def load_and_process_csv(file_path):
    """Load the CSV and process into the required format."""
    
    # Read the CSV file
    df = pd.read_csv(file_path, header=None)
    
    # Find the date row (row 2, index 1)
    date_row = df.iloc[1]
    
    # Extract date columns - look for the pattern "MMM//YY"
    date_columns = []
    date_indices = []
    
    for i, cell in enumerate(date_row):
        if pd.notna(cell) and isinstance(cell, str) and '//' in cell:
            # Parse date like "Jul//18" to "2018-07-01"
            try:
                month_year = cell.strip()
                month_abbr, year = month_year.split('//')
                year = '20' + year if len(year) == 2 else year
                
                # Convert month abbreviation to number
                month_map = {
                    'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
                    'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
                }
                month_num = month_map.get(month_abbr, 1)
                
                date_str = f"{year}-{month_num:02d}-01"
                date_columns.append(pd.to_datetime(date_str))
                date_indices.append(i)
            except:
                continue
    
    print(f"Found {len(date_columns)} date columns from {date_columns[0]} to {date_columns[-1]}")
    
    # Create asset category mapping
    asset_mapping = {
        'Bank accounts': 'cashVal',
        'Bank Accounts': 'cashVal',
        'line of credit': 'cashVal',
        'Savings account': 'cashVal',
        
        'Margin': 'equitiesVal',
        'TFSA': 'equitiesVal', 
        'RRSP': 'equitiesVal',
        'IKBR': 'equitiesVal',
        'Manulife RPP': 'fixedIncomeVal',
        'Wealthsimple FHSA': 'equitiesVal',
        
        'Phantom Wallet': 'cryptoVal',
        'Blue Wallet': 'cryptoVal',
        'Cryptocurrency': 'cryptoVal',
        
        # Default for other assets
        'other': 'otherVal'
    }
    
    # Process each asset row and unpivot
    records = []
    
    for idx, row in df.iterrows():
        if idx < 3:  # Skip header rows
            continue
            
        # Get asset name/description
        asset_name = ""
        description = ""
        
        # Look for asset name in first few columns
        for col_idx in range(min(3, len(row))):
            cell_val = row.iloc[col_idx]
            if pd.notna(cell_val) and str(cell_val).strip():
                if not asset_name:
                    asset_name = str(cell_val).strip()
                elif not description:
                    description = str(cell_val).strip()
        
        # Skip empty rows or summary rows
        if not asset_name or asset_name in ['', 'Subtotal', 'Total', 'Net Worth', 'NW YTD %', 'NW YoY', 'Crypto % NW']:
            continue
            
        # Determine category
        category = 'otherVal'
        for key, cat in asset_mapping.items():
            if key.lower() in asset_name.lower() or key.lower() in description.lower():
                category = cat
                break
        
        # Extract values for each date
        for i, date_idx in enumerate(date_indices):
            if date_idx < len(row):
                value_str = str(row.iloc[date_idx]).strip()
                
                # Skip empty, dash, or non-numeric values
                if value_str in ['', '-', 'nan', 'NaN'] or pd.isna(row.iloc[date_idx]):
                    continue
                
                # Clean and parse numeric value
                try:
                    # Remove commas, quotes, parentheses (negative values)
                    clean_value = re.sub(r'[",]', '', value_str)
                    
                    # Handle parentheses as negative
                    if clean_value.startswith('(') and clean_value.endswith(')'):
                        clean_value = '-' + clean_value[1:-1]
                    
                    value = float(clean_value)
                    
                    records.append({
                        'date': date_columns[i],
                        'asset_name': asset_name,
                        'description': description,
                        'category': category,
                        'value': value
                    })
                    
                except (ValueError, TypeError):
                    continue
    
    return pd.DataFrame(records)

def aggregate_by_month_category(df):
    """Group by date and category, then pivot to get category totals per month."""
    
    # Group by date and category
    monthly_category = df.groupby(['date', 'category'])['value'].sum().reset_index()
    
    # Pivot to get categories as columns
    pivot_df = monthly_category.pivot(index='date', columns='category', values='value').fillna(0)
    
    # Ensure all required columns exist
    required_columns = ['cashVal', 'cryptoVal', 'equitiesVal', 'fixedIncomeVal', 'otherVal']
    for col in required_columns:
        if col not in pivot_df.columns:
            pivot_df[col] = 0
    
    # Calculate total net worth
    pivot_df['totalNW'] = pivot_df[required_columns].sum(axis=1)
    
    # Calculate crypto percentage
    pivot_df['cryptoPct'] = (pivot_df['cryptoVal'] / pivot_df['totalNW']).fillna(0)
    
    return pivot_df.reset_index()

def calculate_derived_metrics(df):
    """Calculate MoM, YoY, rolling returns, drawdown, and milestones."""
    
    df = df.sort_values('date').copy()
    
    # Month-over-Month percentage change
    df['MoM_pct'] = df['totalNW'].pct_change()
    
    # Year-over-Year percentage change
    df['YoY_pct'] = df['totalNW'].pct_change(periods=12)
    
    # 12-month rolling return and standard deviation
    df['rolling_12m_return'] = df['totalNW'].pct_change(periods=12)
    df['rolling_12m_stdev'] = df['totalNW'].pct_change().rolling(window=12).std()
    
    # Maximum drawdown to date
    df['cummax'] = df['totalNW'].cummax()
    df['drawdown'] = (df['totalNW'] - df['cummax']) / df['cummax']
    df['max_drawdown_to_date'] = df['drawdown'].cummin()
    
    # Drop helper column
    df = df.drop(['cummax', 'drawdown'], axis=1)
    
    # Milestone flag for 100k CAD boundaries
    df['milestone_flag'] = False
    
    # Track 100k milestones
    for i in range(1, len(df)):
        prev_milestone = int(df.iloc[i-1]['totalNW'] // 100000)
        curr_milestone = int(df.iloc[i]['totalNW'] // 100000)
        
        if curr_milestone > prev_milestone:
            df.loc[df.index[i], 'milestone_flag'] = True
    
    return df

def format_output(df):
    """Format the final output according to specification."""
    
    # Reorder columns as specified
    column_order = [
        'date', 'totalNW', 'cryptoVal', 'cryptoPct', 'equitiesVal', 
        'fixedIncomeVal', 'cashVal', 'otherVal', 'MoM_pct', 'YoY_pct', 
        'rolling_12m_return', 'rolling_12m_stdev', 'max_drawdown_to_date', 
        'milestone_flag'
    ]
    
    # Select and reorder columns
    output_df = df[column_order].copy()
    
    # Format percentages
    pct_columns = ['cryptoPct', 'MoM_pct', 'YoY_pct', 'rolling_12m_return', 'rolling_12m_stdev', 'max_drawdown_to_date']
    for col in pct_columns:
        output_df[col] = output_df[col].round(4)
    
    # Format monetary values
    money_columns = ['totalNW', 'cryptoVal', 'equitiesVal', 'fixedIncomeVal', 'cashVal', 'otherVal']
    for col in money_columns:
        output_df[col] = output_df[col].round(2)
    
    return output_df

def main():
    """Main processing function."""
    
    input_file = "docs/Net Worth.csv"
    output_file = "PF_NetWorth_Digest.csv"
    
    if not os.path.exists(input_file):
        print(f"Error: Input file '{input_file}' not found")
        return 1
    
    try:
        print("Loading and processing CSV...")
        raw_df = load_and_process_csv(input_file)
        print(f"Loaded {len(raw_df)} asset-month records")
        
        print("Aggregating by month and category...")
        monthly_df = aggregate_by_month_category(raw_df)
        print(f"Created {len(monthly_df)} monthly records")
        
        print("Calculating derived metrics...")
        final_df = calculate_derived_metrics(monthly_df)
        
        print("Formatting output...")
        output_df = format_output(final_df)
        
        # Add timestamp comment at the top
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Write output file
        with open(output_file, 'w') as f:
            f.write(f"# Net Worth Digest - Generated: {timestamp}\n")
            output_df.to_csv(f, index=False)
        
        print(f"Output written to '{output_file}'")
        
        # Print summary statistics
        print("\n=== SUMMARY ===")
        print(f"Date range: {output_df['date'].min()} to {output_df['date'].max()}")
        print(f"Latest total NW: ${output_df['totalNW'].iloc[-1]:,.2f}")
        print(f"Latest crypto %: {output_df['cryptoPct'].iloc[-1]:.1%}")
        print(f"Max drawdown: {output_df['max_drawdown_to_date'].min():.1%}")
        print(f"Milestones hit: {output_df['milestone_flag'].sum()}")
        
        # Show recent records
        print("\n=== RECENT RECORDS ===")
        print(output_df.tail(3).to_string())
        
        return 0
        
    except Exception as e:
        print(f"Error processing file: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())