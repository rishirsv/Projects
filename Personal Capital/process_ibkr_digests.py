#!/usr/bin/env python3
"""
IBKR Portfolio Analysis Script
Generates 4 digest files from IBKR data:
1. PF_IBKR_Performance_Digest.csv
2. PF_IBKR_Allocation_Digest.csv  
3. PF_IBKR_Position_Digest.csv
4. PF_Cashflow_Digest.csv

Generated: {timestamp}
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import re
import sys
import os
from scipy import stats

def parse_ibkr_csv(file_path):
    """Parse the IBKR CSV file into structured sections."""
    
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    sections = {}
    current_section = None
    current_data = []
    
    for line in lines:
        parts = [p.strip() for p in line.split(',')]
        
        if len(parts) < 2:
            continue
            
        section_name = parts[0]
        row_type = parts[1]
        
        if row_type == 'MetaInfo':
            if current_section and current_data:
                sections[current_section] = current_data
            current_section = section_name
            current_data = []
            
        elif row_type in ['Header', 'Data']:
            if current_section:
                current_data.append(parts)
    
    # Add final section
    if current_section and current_data:
        sections[current_section] = current_data
    
    return sections

def create_performance_digest(sections):
    """Generate PF_IBKR_Performance_Digest.csv"""
    
    print("Creating Performance Digest...")
    
    # Extract Key Statistics
    key_stats = sections.get('Key Statistics', [])
    perf_data = sections.get('Historical Performance Benchmark Comparison', [])
    
    # Parse key statistics data
    stats_header = None
    stats_row = None
    
    for row in key_stats:
        if row[1] == 'Header':
            stats_header = row[2:]
        elif row[1] == 'Data':
            stats_row = row[2:]
    
    # Create mapping of key stats
    stats_dict = {}
    if stats_header and stats_row:
        for i, header in enumerate(stats_header):
            if i < len(stats_row):
                try:
                    stats_dict[header] = float(stats_row[i]) if stats_row[i] not in ['', '-'] else None
                except:
                    stats_dict[header] = stats_row[i]
    
    # Extract period performance data
    period_perf = {}
    benchmark_perf = {}
    
    for row in perf_data:
        if row[1] == 'Header' and 'MTD' in row:
            # Performance by period header
            perf_header = row[2:]
        elif row[1] == 'Data' and len(row) > 8:
            account = row[2]
            if account == 'SPXTR':  # S&P 500 benchmark
                benchmark_perf = {perf_header[i]: row[i+3] for i in range(len(perf_header)) if i+3 < len(row)}
            elif account == 'Consolidated':  # Portfolio performance
                period_perf = {perf_header[i]: row[i+3] for i in range(len(perf_header)) if i+3 < len(row)}
    
    # Extract monthly returns for regression analysis
    monthly_returns = []
    benchmark_monthly = []
    
    for row in perf_data:
        if row[1] == 'Data' and len(row) >= 10 and row[2].startswith('2025'):
            # Monthly data
            if len(row) >= 10:
                try:
                    spy_return = float(row[4]) if row[4] not in ['', '-'] else None
                    portfolio_return = float(row[9]) if row[9] not in ['', '-'] else None
                    
                    if spy_return is not None and portfolio_return is not None:
                        benchmark_monthly.append(spy_return / 100)
                        monthly_returns.append(portfolio_return / 100)
                except:
                    continue
    
    # Calculate alpha and beta via regression
    alpha_vs_spy = np.nan
    beta_vs_spy = np.nan
    
    if len(monthly_returns) >= 3 and len(benchmark_monthly) >= 3:
        try:
            slope, intercept, r_value, p_value, std_err = stats.linregress(benchmark_monthly, monthly_returns)
            beta_vs_spy = slope
            alpha_vs_spy = intercept * 12  # Annualize alpha
        except:
            pass
    
    # Calculate risk metrics
    if monthly_returns:
        monthly_std = np.std(monthly_returns)
        stdev = monthly_std * np.sqrt(12)  # Annualize
        
        # Assume 3% risk-free rate
        risk_free_rate = 0.03
        avg_return = np.mean(monthly_returns) * 12
        
        sharpe = (avg_return - risk_free_rate) / stdev if stdev > 0 else np.nan
        
        # Sortino ratio (downside deviation)
        downside_returns = [r for r in monthly_returns if r < risk_free_rate/12]
        if downside_returns:
            downside_std = np.std(downside_returns) * np.sqrt(12)
            sortino = (avg_return - risk_free_rate) / downside_std if downside_std > 0 else np.nan
        else:
            sortino = np.nan
        
        # Max drawdown calculation (approximated)
        cumulative = np.cumprod([1 + r for r in monthly_returns])
        running_max = np.maximum.accumulate(cumulative)
        drawdowns = (cumulative - running_max) / running_max
        max_drawdown_pct = np.min(drawdowns) if len(drawdowns) > 0 else np.nan
        
    else:
        stdev = np.nan
        sharpe = np.nan
        sortino = np.nan
        max_drawdown_pct = np.nan
    
    # Build performance digest records
    records = []
    
    # Define periods and their mappings
    period_mapping = {
        'MTD': 'MTD',
        'QTD': 'QTD', 
        'YTD': 'YTD',
        '1 Year': '1Y',
        '3 Year': '3Y',
        '5 Year': '5Y',
        '10 Year': '10Y',
        'Since Inception': 'ITD'
    }
    
    for period, short_name in period_mapping.items():
        if period in period_perf and period in benchmark_perf:
            try:
                portfolio_return = float(period_perf[period]) if period_perf[period] not in ['', '-'] else np.nan
                spy_return = float(benchmark_perf[period]) if benchmark_perf[period] not in ['', '-'] else np.nan
                
                outperformance = portfolio_return - spy_return if not (np.isnan(portfolio_return) or np.isnan(spy_return)) else np.nan
                
                # Get NAV values (approximated)
                nav_end = stats_dict.get('EndingNAV', np.nan)
                nav_start = nav_end / (1 + portfolio_return/100) if not np.isnan(portfolio_return) and not np.isnan(nav_end) else np.nan
                
                # Only include calculated risk metrics for longer periods
                period_sharpe = sharpe if period in ['1 Year', '3 Year', '5 Year', '10 Year', 'Since Inception'] else np.nan
                period_sortino = sortino if period in ['1 Year', '3 Year', '5 Year', '10 Year', 'Since Inception'] else np.nan
                period_stdev = stdev if period in ['1 Year', '3 Year', '5 Year', '10 Year', 'Since Inception'] else np.nan
                period_alpha = alpha_vs_spy if period in ['1 Year', '3 Year', '5 Year', '10 Year', 'Since Inception'] else np.nan
                period_beta = beta_vs_spy if period in ['1 Year', '3 Year', '5 Year', '10 Year', 'Since Inception'] else np.nan
                period_drawdown = max_drawdown_pct if period in ['1 Year', '3 Year', '5 Year', '10 Year', 'Since Inception'] else np.nan
                
                records.append({
                    'period': short_name,
                    'navStart': nav_start,
                    'navEnd': nav_end,
                    'return_pct': portfolio_return,
                    'alpha_vs_SPY': period_alpha,
                    'beta_vs_SPY': period_beta,
                    'sharpe': period_sharpe,
                    'sortino': period_sortino,
                    'stdev': period_stdev,
                    'max_drawdown_pct': period_drawdown,
                    'benchmark_SPY_return': spy_return,
                    'outperformance_pct': outperformance
                })
                
            except:
                continue
    
    return pd.DataFrame(records)

def create_allocation_digest(sections):
    """Generate PF_IBKR_Allocation_Digest.csv"""
    
    print("Creating Allocation Digest...")
    
    # Extract Open Position Summary
    positions = sections.get('Open Position Summary', [])
    
    records = []
    
    for row in positions:
        if row[1] == 'Data' and len(row) >= 13 and row[2] != 'Total':
            try:
                # Parse position data
                date = row[2]
                instrument_type = row[3]
                currency = row[4]
                symbol = row[5] if row[5] else 'CASH'
                description = row[6] if row[6] else symbol
                sector = row[7] if row[7] else 'Cash'
                quantity = float(row[8]) if row[8] and row[8] != '' else 0
                close_price = float(row[9]) if row[9] and row[9] != '' else 0
                market_value = float(row[10]) if row[10] and row[10] != '' else 0
                cost_basis = float(row[11]) if row[11] and row[11] != '' else 0
                unrealized_pnl = float(row[12]) if row[12] and row[12] != '' else 0
                fx_rate = float(row[13]) if row[13] and row[13] != '' else 1
                
                # Convert to CAD
                market_value_cad = market_value * fx_rate if currency != 'CAD' else market_value
                cost_basis_cad = cost_basis * fx_rate if currency != 'CAD' else cost_basis
                
                # Calculate unrealized gain %
                unrealized_gain_pct = (unrealized_pnl / cost_basis * 100) if cost_basis != 0 else 0
                
                # Determine asset class
                asset_class = 'Cash' if instrument_type == 'Cash' else 'Equity'
                
                # Determine country (simplified)
                country = 'Canada' if currency == 'CAD' else 'United States'
                
                records.append({
                    'ticker': symbol,
                    'securityName': description,
                    'sector': sector,
                    'accountType': 'All',  # Could extract from account mapping if needed
                    'marketValue_CAD': market_value_cad,
                    'weight_pct': 0,  # Will calculate after getting total
                    'unrealized_gain_pct': unrealized_gain_pct,
                    'dividendYield': '',  # Not available in this data
                    'country': country,
                    'assetClass': asset_class
                })
                
            except Exception as e:
                continue
    
    df = pd.DataFrame(records)
    
    if len(df) > 0:
        # Calculate weights
        total_value = df['marketValue_CAD'].sum()
        df['weight_pct'] = (df['marketValue_CAD'] / total_value * 100) if total_value > 0 else 0
        
        # Sort by weight descending
        df = df.sort_values('weight_pct', ascending=False)
        
        # Add aggregate rows by asset class
        asset_classes = df['assetClass'].unique()
        aggregate_rows = []
        
        for asset_class in asset_classes:
            subset = df[df['assetClass'] == asset_class]
            total_value = subset['marketValue_CAD'].sum()
            total_weight = subset['weight_pct'].sum()
            
            aggregate_rows.append({
                'ticker': f'TOTAL_{asset_class.upper()}',
                'securityName': f'Total {asset_class}',
                'sector': 'Aggregate',
                'accountType': 'All',
                'marketValue_CAD': total_value,
                'weight_pct': total_weight,
                'unrealized_gain_pct': '',
                'dividendYield': '',
                'country': 'Multiple',
                'assetClass': f'Total_{asset_class}'
            })
        
        # Append aggregates
        aggregate_df = pd.DataFrame(aggregate_rows)
        df = pd.concat([df, aggregate_df], ignore_index=True)
    
    return df

def create_position_digest(sections):
    """Generate PF_IBKR_Position_Digest.csv"""
    
    print("Creating Position Digest...")
    
    # For this digest, we'll use current positions and estimate 12-month returns
    # In a real implementation, you'd have historical performance by symbol data
    
    positions = sections.get('Open Position Summary', [])
    
    records = []
    
    for row in positions:
        if row[1] == 'Data' and len(row) >= 13 and row[2] != 'Total':
            try:
                symbol = row[5] if row[5] else 'CASH'
                description = row[6] if row[6] else symbol
                currency = row[4]
                market_value = float(row[10]) if row[10] and row[10] != '' else 0
                cost_basis = float(row[11]) if row[11] and row[11] != '' else 0
                fx_rate = float(row[13]) if row[13] and row[13] != '' else 1
                
                # Convert to CAD
                market_value_cad = market_value * fx_rate if currency != 'CAD' else market_value
                
                # Estimate 12-month return from unrealized gain (approximation)
                unrealized_pnl = float(row[12]) if row[12] and row[12] != '' else 0
                twelve_month_return = (unrealized_pnl / cost_basis * 100) if cost_basis != 0 else 0
                
                records.append({
                    'ticker': symbol,
                    'securityName': description,
                    'accountType': 'All',
                    'marketValue_CAD': market_value_cad,
                    'weight_pct': 0,  # Will calculate after getting total
                    '12m_return_pct': twelve_month_return,
                    'unrealized_gain_pct': twelve_month_return,  # Same as above for this data
                    'contribution_to_total_return_pct': 0  # Will calculate after weights
                })
                
            except:
                continue
    
    df = pd.DataFrame(records)
    
    if len(df) > 0:
        # Calculate weights
        total_value = df['marketValue_CAD'].sum()
        df['weight_pct'] = (df['marketValue_CAD'] / total_value * 100) if total_value > 0 else 0
        
        # Calculate contribution to total return
        df['contribution_to_total_return_pct'] = df['weight_pct'] * df['12m_return_pct'] / 100
        
        # Sort by 12-month return descending and take top 25
        top_performers = df.sort_values('12m_return_pct', ascending=False).head(25)
        
        # Sort by 12-month return ascending and take bottom 10
        bottom_performers = df.sort_values('12m_return_pct', ascending=True).head(10)
        
        # Combine and remove duplicates
        combined = pd.concat([top_performers, bottom_performers]).drop_duplicates(subset=['ticker'])
        
        # Re-rank
        combined = combined.reset_index(drop=True)
        combined['rank'] = range(1, len(combined) + 1)
        
        # Reorder columns
        combined = combined[['rank', 'ticker', 'securityName', 'accountType', 'marketValue_CAD', 
                            'weight_pct', '12m_return_pct', 'unrealized_gain_pct', 'contribution_to_total_return_pct']]
    
    return combined

def create_cashflow_digest(transaction_file):
    """Generate PF_Cashflow_Digest.csv"""
    
    print("Creating Cashflow Digest...")
    
    # Read transaction history
    df = pd.read_csv(transaction_file)
    
    # Parse date and add year/quarter
    df['Date'] = pd.to_datetime(df['Date'])
    df['year'] = df['Date'].dt.year
    df['quarter'] = df['Date'].dt.quarter
    
    # Categorize transaction types
    def categorize_transaction(transaction_type, description):
        transaction_type = str(transaction_type).lower()
        description = str(description).lower()
        
        if 'deposit' in transaction_type or 'deposit' in description:
            return 'deposits'
        elif 'withdrawal' in transaction_type or 'withdrawal' in description:
            return 'withdrawals'
        elif 'dividend' in transaction_type or 'dividend' in description:
            return 'dividends'
        elif 'interest' in transaction_type or 'interest' in description:
            return 'interest'
        elif 'commission' in transaction_type or 'fee' in transaction_type or 'commission' in description:
            return 'fees'
        else:
            return 'other'
    
    df['category'] = df.apply(lambda row: categorize_transaction(row['Transaction Type'], row['Description']), axis=1)
    
    # Convert Net Amount to numeric, handling CAD amounts
    df['Net Amount'] = df['Net Amount'].astype(str).str.replace(',', '').str.replace('"', '')
    df['Net Amount'] = pd.to_numeric(df['Net Amount'], errors='coerce').fillna(0)
    
    # Get account type mapping (simplified)
    df['accountType'] = df['Account'].map({'TFSA': 'TFSA', 'RRSP': 'RRSP', 'Margin': 'Margin'}).fillna('Other')
    
    # Group by year, quarter, account, and category
    grouped = df.groupby(['year', 'quarter', 'accountType', 'category'])['Net Amount'].sum().reset_index()
    
    # Pivot to get categories as columns
    pivot = grouped.pivot_table(
        index=['year', 'quarter', 'accountType'], 
        columns='category', 
        values='Net Amount', 
        fill_value=0
    ).reset_index()
    
    # Ensure all required columns exist
    required_columns = ['deposits', 'withdrawals', 'dividends', 'interest', 'fees']
    for col in required_columns:
        if col not in pivot.columns:
            pivot[col] = 0
    
    # Calculate net cashflow
    pivot['netCashflow'] = pivot['deposits'] + pivot['withdrawals'] + pivot['dividends'] + pivot['interest'] + pivot['fees']
    
    # Select and reorder columns
    final_columns = ['year', 'quarter', 'accountType', 'deposits', 'withdrawals', 'dividends', 'interest', 'fees', 'netCashflow']
    result = pivot[final_columns]
    
    # Sort chronologically
    result = result.sort_values(['year', 'quarter', 'accountType'])
    
    return result

def main():
    """Main processing function."""
    
    portfolio_file = "docs/IKBR Portfolio - Inception to Date.csv"
    transaction_file = "docs/IKBR Portfolio - Transaction History.csv"
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    if not os.path.exists(portfolio_file):
        print(f"Error: Portfolio file '{portfolio_file}' not found")
        return 1
    
    if not os.path.exists(transaction_file):
        print(f"Error: Transaction file '{transaction_file}' not found")
        return 1
    
    try:
        print("Parsing IBKR portfolio data...")
        sections = parse_ibkr_csv(portfolio_file)
        print(f"Found {len(sections)} data sections")
        
        # Generate each digest file
        print("\n" + "="*50)
        
        # 1. Performance Digest
        performance_df = create_performance_digest(sections)
        performance_df = performance_df.round(4)
        
        with open("PF_IBKR_Performance_Digest.csv", 'w') as f:
            f.write(f"# IBKR Performance Digest - Generated: {timestamp}\n")
            performance_df.to_csv(f, index=False)
        
        print(f"✓ PF_IBKR_Performance_Digest.csv - {len(performance_df)} periods")
        
        # 2. Allocation Digest
        allocation_df = create_allocation_digest(sections)
        allocation_df = allocation_df.round(4)
        
        with open("PF_IBKR_Allocation_Digest.csv", 'w') as f:
            f.write(f"# IBKR Allocation Digest - Generated: {timestamp}\n")
            allocation_df.to_csv(f, index=False)
        
        print(f"✓ PF_IBKR_Allocation_Digest.csv - {len(allocation_df)} positions")
        
        # 3. Position Digest
        position_df = create_position_digest(sections)
        position_df = position_df.round(4)
        
        with open("PF_IBKR_Position_Digest.csv", 'w') as f:
            f.write(f"# IBKR Position Digest - Generated: {timestamp}\n")
            position_df.to_csv(f, index=False)
        
        print(f"✓ PF_IBKR_Position_Digest.csv - {len(position_df)} positions")
        
        # 4. Cashflow Digest
        cashflow_df = create_cashflow_digest(transaction_file)
        cashflow_df = cashflow_df.round(2)
        
        with open("PF_Cashflow_Digest.csv", 'w') as f:
            f.write(f"# IBKR Cashflow Digest - Generated: {timestamp}\n")
            cashflow_df.to_csv(f, index=False)
        
        print(f"✓ PF_Cashflow_Digest.csv - {len(cashflow_df)} periods")
        
        print("\n" + "="*50)
        print("All IBKR digest files generated successfully!")
        
        # Summary statistics
        print("\n=== SUMMARY ===")
        print(f"Performance periods analyzed: {len(performance_df)}")
        print(f"Total positions: {len(allocation_df)}")
        print(f"Top/bottom performers: {len(position_df)}")
        print(f"Cashflow periods: {len(cashflow_df)}")
        
        return 0
        
    except Exception as e:
        print(f"Error processing IBKR data: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())