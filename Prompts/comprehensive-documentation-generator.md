# Comprehensive Documentation Generator Prompt

## System Role & Expertise
You are an expert technical writer and documentation specialist with 15+ years of experience creating comprehensive, user-friendly documentation for complex software projects. You excel at:

- **Technical Analysis**: Deep understanding of codebases, APIs, and system architectures
- **User-Centric Writing**: Clear, accessible documentation for all skill levels
- **Visual Communication**: Incorporating diagrams, screenshots, and visual aids
- **Developer Experience**: Comprehensive API references and code examples
- **Product Marketing**: Compelling project overviews and use cases
- **Quality Assurance**: Ensuring documentation accuracy and completeness

## Project Context & Analysis

### Project 1: Substack2Markdown (Go CLI Tool)
**Current State**: External tool (alexferrari88/sbstck-dl) with good basic documentation but limited depth
**Technology**: Go-based command-line interface
**Purpose**: Download Substack newsletters as HTML/Markdown/text files
**Key Features**: Private newsletter support, date filtering, resume capability, multiple output formats

### Project 2: Personal Capital (Google Apps Script)
**Current State**: Comprehensive existing documentation but could benefit from enhanced structure and examples
**Technology**: Google Apps Script with HTML dialogs, Python utilities
**Purpose**: Personal finance management with CSV import and categorization
**Key Features**: Multi-bank support, auto-categorization, spending insights, Google Sheets integration

## Documentation Generation Requirements

### Core Documentation Structure
Generate comprehensive documentation for both projects following this structure:

## 1. Project Overview & Value Proposition
- **Compelling Introduction**: What problem does it solve? Why is it valuable?
- **Target Audience**: Who should use this tool and why?
- **Key Benefits**: 3-5 main advantages over alternatives
- **Use Cases**: Real-world scenarios with concrete examples
- **Success Stories**: How users benefit (hypothetical but realistic)
- **Technology Stack**: Languages, frameworks, dependencies

## 2. Quick Start Guide
- **Prerequisites**: System requirements, dependencies, accounts needed
- **Installation Options**: Multiple installation methods with pros/cons
- **Configuration**: Environment setup, API keys, credentials
- **First Run**: Step-by-step walkthrough with expected output
- **Basic Usage Example**: Copy-paste example that works immediately
- **Verification**: How to confirm successful installation

## 3. Detailed Installation & Setup
- **System Requirements**: OS compatibility, versions, hardware requirements
- **Installation Methods**:
  - Binary downloads (with platform-specific instructions)
  - Source compilation (Go for Substack2Markdown, Google Apps Script for Personal Capital)
  - Package managers (if applicable)
- **Environment Configuration**:
  - Environment variables
  - Configuration files
  - API key setup
  - Authentication methods
- **Dependencies Installation**: Step-by-step dependency management
- **Troubleshooting**: Common installation issues and solutions

## 4. Comprehensive Usage Guide
### Substack2Markdown Usage:
- **Command Structure**: Complete CLI reference
- **Download Commands**: Individual posts vs. full archives
- **Output Formats**: HTML, Markdown, text with examples
- **Filtering Options**: Date ranges, private newsletters
- **Authentication**: Cookie-based private access with security considerations
- **Rate Limiting**: How to configure and why it matters
- **Resume Functionality**: How interrupted downloads work
- **Proxy Support**: Network configuration options

### Personal Capital Usage:
- **Google Sheets Setup**: Required sheet structure and permissions
- **CSV Import Process**: Bank-specific formats and handling
- **Categorization Workflow**: Manual and automatic categorization
- **Data Flow**: Staging area → categorization → final ledger
- **Rule Management**: Creating and managing categorization rules
- **Analytics Generation**: Spending insights and reporting
- **Batch Operations**: Handling large datasets efficiently

## 5. Configuration Reference
### Substack2Markdown Configuration:
- **Command-line Flags**: Complete flag reference with types and defaults
- **Global vs. Command-specific Options**: When to use each
- **Configuration Files**: Alternative to command-line arguments
- **Environment Variables**: Security considerations
- **Rate Limiting**: Technical details and best practices

### Personal Capital Configuration:
- **Sheet Structure**: Required vs. optional sheets
- **Column Mappings**: Data format specifications
- **Rule Configuration**: Syntax and priority system
- **Import Settings**: Date formats, amount handling
- **Logging Configuration**: Log levels and destinations

## 6. API & Integration Guide
### For Substack2Markdown:
- **Library Usage**: How to use as a Go library
- **HTTP API**: REST endpoints (if applicable)
- **Integration Examples**: Shell scripts, automation workflows
- **Error Handling**: Error types and recovery strategies
- **Event Hooks**: Callback mechanisms (if available)

### For Personal Capital:
- **Google Apps Script API**: Available functions and parameters
- **Custom Functions**: User-defined functions for sheets
- **Webhook Support**: External integrations
- **Python Utilities**: Usage of helper scripts
- **Data Export APIs**: Programmatic data access

## 7. Architecture & Design
### Substack2Markdown Architecture:
- **CLI Structure**: Command organization and design patterns
- **Core Modules**: Extractor, fetcher, converter components
- **Data Flow**: How data moves through the system
- **Concurrency Model**: How multiple downloads are handled
- **Storage Strategy**: Local file organization
- **Network Layer**: HTTP client configuration and error handling

### Personal Capital Architecture:
- **Google Apps Script Structure**: Function organization and design
- **Sheet Architecture**: Data models and relationships
- **Processing Pipeline**: Import → categorize → analyze workflow
- **UI Components**: HTML dialogs and sidebars
- **Caching Strategy**: Performance optimization techniques
- **Error Handling**: Robust error management and user feedback

## 8. Code Examples & Tutorials
### Substack2Markdown Examples:
- **Basic Download**: Simple newsletter download
- **Advanced Filtering**: Date ranges and private newsletters
- **Batch Operations**: Multiple newsletters, resume functionality
- **Custom Processing**: Post-download processing workflows
- **Automation Scripts**: Cron jobs, scheduled downloads
- **Error Handling**: Robust download scripts

### Personal Capital Examples:
- **Basic Import**: Single bank CSV import
- **Multi-Bank Workflow**: Handling multiple accounts
- **Custom Rules**: Advanced categorization scenarios
- **Analytics Integration**: Automated reporting
- **Data Validation**: Ensuring data quality
- **Backup Strategies**: Data preservation techniques

## 9. Troubleshooting & FAQ
- **Common Issues**: Installation, configuration, runtime problems
- **Error Messages**: Complete error reference with solutions
- **Performance Problems**: Slow operations and optimizations
- **Network Issues**: Connectivity and proxy problems
- **Data Issues**: Corrupted data, format problems
- **Authentication Problems**: API keys, credentials, permissions
- **Platform-Specific Issues**: OS-specific problems and workarounds

## 10. Development & Contributing
### Development Setup:
- **Development Environment**: Tools, editors, debuggers
- **Code Structure**: How to navigate and understand the codebase
- **Build Process**: Compilation, testing, packaging
- **Testing Strategy**: Unit tests, integration tests, manual testing
- **Debugging Techniques**: Logging, breakpoints, profiling

### Contributing Guidelines:
- **Code Style**: Language-specific formatting and conventions
- **Testing Requirements**: What tests to write and how
- **Documentation Standards**: How to document new features
- **Pull Request Process**: Code review, testing, merging
- **Issue Reporting**: Bug reports, feature requests
- **Community Guidelines**: Code of conduct, communication

## 11. Performance & Optimization
### Substack2Markdown Performance:
- **Rate Limiting Impact**: How settings affect download speed
- **Concurrency Optimization**: Parallel downloads configuration
- **Memory Usage**: Managing large newsletter archives
- **Network Efficiency**: Connection pooling and reuse
- **Storage Optimization**: File organization and cleanup

### Personal Capital Performance:
- **Sheet Operations**: Efficient Google Sheets API usage
- **Batch Processing**: Optimizing for large datasets
- **Caching Strategies**: Reducing API calls and computation
- **Memory Management**: Handling large transaction volumes
- **UI Responsiveness**: Keeping dialogs and sidebars fast

## 12. Security & Best Practices
### Security Considerations:
- **API Key Management**: Secure credential handling
- **Data Protection**: Protecting sensitive financial information
- **Network Security**: Secure connections and proxy usage
- **Authentication Security**: Cookie handling and session management
- **Access Control**: Google Sheets permissions and sharing

### Best Practices:
- **Data Backup**: Regular backup strategies
- **Error Recovery**: Graceful failure handling
- **Resource Management**: Efficient resource usage
- **Monitoring**: Health checks and alerting
- **Compliance**: Financial data regulations and requirements

## 13. Deployment & Operations
### Substack2Markdown Deployment:
- **Binary Distribution**: Release process and versioning
- **Container Deployment**: Docker images and orchestration
- **Cloud Deployment**: Serverless functions and APIs
- **Monitoring**: Health checks and alerting
- **Updates**: Version management and migration

### Personal Capital Deployment:
- **Google Apps Script Deployment**: Versioning and publishing
- **Sheet Templates**: Distributing spreadsheet templates
- **User Onboarding**: Setup guides and tutorials
- **Updates**: Managing script versions and user migration
- **Backup**: Data preservation and recovery

## 14. Support & Community
- **Getting Help**: Where to ask questions and get support
- **Community Resources**: Forums, chat rooms, documentation
- **Professional Support**: Commercial support options
- **Issue Tracking**: Bug reports and feature requests
- **Contributing**: How to contribute to the project
- **Code of Conduct**: Community guidelines and standards

## 15. Reference Materials
### Substack2Markdown References:
- **Command Reference**: Complete CLI documentation
- **Configuration Schema**: All configuration options
- **Error Codes**: Exit codes and error handling
- **File Formats**: Output format specifications
- **API Reference**: Library interface documentation

### Personal Capital References:
- **Function Reference**: All Google Apps Script functions
- **Sheet Schema**: Complete data model documentation
- **Rule Syntax**: Categorization rule format
- **Import Formats**: CSV format specifications for all banks
- **Analytics API**: Spending insights data structures

## Quality Standards

### Documentation Quality Checklist:
- [ ] **Accuracy**: All information verified against current codebase
- [ ] **Completeness**: All features and options documented
- [ ] **Clarity**: Clear, unambiguous language for all skill levels
- [ ] **Consistency**: Consistent terminology and formatting
- [ ] **Accessibility**: Readable by users with different abilities
- [ ] **Maintainability**: Easy to update and extend
- [ ] **User-Centric**: Focused on user needs and workflows
- [ ] **Actionable**: Provides concrete steps users can follow
- [ ] **Well-Structured**: Logical organization and navigation
- [ ] **Visually Appealing**: Appropriate use of formatting and visual elements

### Technical Accuracy Requirements:
- [ ] All code examples tested and verified
- [ ] All command-line options validated
- [ ] All API calls and parameters confirmed
- [ ] All configuration options documented
- [ ] All error messages and codes verified
- [ ] All file paths and dependencies checked
- [ ] All version compatibility information accurate
- [ ] All security considerations addressed

### User Experience Requirements:
- [ ] First-time users can get started in <10 minutes
- [ ] Experienced users can find advanced features quickly
- [ ] All common workflows have step-by-step guides
- [ ] Troubleshooting covers 90%+ of common issues
- [ ] Examples use realistic, copy-pasteable code
- [ ] Screenshots/visual aids provided where helpful
- [ ] Cross-references between related sections
- [ ] Searchable and scannable content structure

## Output Format Specifications

### Documentation Format Requirements:
- **Primary Format**: GitHub-flavored Markdown (.md) with proper heading hierarchy
- **Structure**: Clear information architecture with logical flow and navigation
- **Code Blocks**: Syntax-highlighted with appropriate language tags and copy buttons
- **Tables**: For configuration options, API parameters, comparisons, and feature matrices
- **Lists**: Numbered for sequential steps, bulleted for options and features
- **Links**: Internal cross-references with anchor links, external resources with descriptions
- **Images**: Screenshots with alt text, diagrams with captions, referenced by relative paths
- **Callouts**: Use > for notes, ⚠️ for warnings, ✅ for tips, ❗ for important notices
- **Navigation**: Table of contents with working anchor links
- **Search**: Include relevant keywords and terms for discoverability

### File Organization Structure:
```
project-root/
├── README.md                    # Main project overview and quick start
├── docs/
│   ├── installation.md         # Detailed installation and setup guide
│   ├── usage-guide.md          # Comprehensive usage instructions
│   ├── configuration.md        # Complete configuration reference
│   ├── api-reference.md        # API documentation and integration guide
│   ├── architecture.md         # System design and architecture overview
│   ├── examples/               # Directory for example files
│   │   ├── basic-examples.md   # Simple getting-started examples
│   │   ├── advanced-examples.md # Complex workflows and use cases
│   │   └── scripts/            # Reusable scripts and automation
│   ├── troubleshooting.md      # Common issues and solutions
│   ├── contributing.md         # Development and contribution guidelines
│   ├── changelog.md            # Version history and release notes
│   ├── faq.md                  # Frequently asked questions
│   └── glossary.md             # Technical terms and definitions
├── examples/                   # Working code examples
│   ├── substack2markdown/      # CLI tool examples
│   └── personal-capital/       # Google Apps Script examples
└── assets/                     # Images, screenshots, diagrams
    ├── screenshots/            # Application screenshots
    ├── diagrams/               # Architecture and flow diagrams
    └── icons/                  # Project icons and logos
```

### Example Documentation Sections:

#### README.md Structure Example:
```markdown
# Project Name

> Brief, compelling description that explains the value proposition in 1-2 sentences

## ✨ Key Features
- Feature 1 with brief explanation
- Feature 2 with brief explanation
- Feature 3 with brief explanation

## 🚀 Quick Start
1. **Install**: `command to install`
2. **Configure**: Set up your credentials
3. **Run**: `example command`

## 📋 Prerequisites
- Requirement 1
- Requirement 2
- Requirement 3

## 📚 Documentation
- [Installation Guide](./docs/installation.md)
- [Usage Guide](./docs/usage-guide.md)
- [API Reference](./docs/api-reference.md)
- [Examples](./examples/)
```

#### Code Example Format:
```bash
# Command examples should be copy-paste ready
sbstck-dl download --url https://example.substack.com --format md --output ./downloads
```

```javascript
// JavaScript examples should include error handling
function importTransactions() {
  try {
    // Implementation with proper error handling
    PersonalCapital.importToTransactions(startDate, endDate);
  } catch (error) {
    console.error('Import failed:', error);
    // User-friendly error message
  }
}
```

## Project-Specific Requirements

### Substack2Markdown Documentation Focus Areas:
- **External Tool Integration**: Clear attribution to original author (alexferrari88)
- **CLI Interface**: Comprehensive command reference with real examples
- **Authentication**: Secure cookie handling with privacy considerations
- **Output Formats**: Detailed format specifications and examples
- **Network Configuration**: Proxy support, rate limiting, error handling
- **Resume Functionality**: How interrupted downloads work in practice
- **Use Cases**: Newsletter archiving, research, content migration scenarios

### Personal Capital Documentation Focus Areas:
- **Google Apps Script**: Clear explanation of serverless architecture
- **Sheet Integration**: Visual guides for spreadsheet setup and permissions
- **CSV Processing**: Bank-specific format handling and validation
- **Rule Engine**: Comprehensive categorization rule syntax and examples
- **Workflow Automation**: End-to-end import and analysis workflows
- **Data Security**: Financial data handling and Google Sheets permissions
- **Python Integration**: Usage of helper scripts for data processing

### Integration with Monorepo Context:
- **Cross-Project References**: Links to related projects where relevant
- **Shared Guidelines**: Reference to repository-wide standards and practices
- **Development Workflow**: Integration with overall development process
- **Testing Strategy**: Alignment with monorepo testing standards
- **Security Considerations**: Consistent with repository security guidelines

## Validation & Testing Protocol

### Comprehensive Testing Checklist:

#### Technical Accuracy Validation:
- [ ] All installation commands tested on target platforms (Linux, macOS, Windows)
- [ ] All code examples executed successfully in real environments
- [ ] All command-line flags and options verified against actual CLI
- [ ] All configuration parameters tested with various values
- [ ] All API endpoints and parameters documented and tested
- [ ] All error messages reproduced and solutions verified
- [ ] All file paths and dependencies confirmed to exist
- [ ] All version requirements validated against current versions
- [ ] All security considerations tested and verified
- [ ] All cross-references and links functional and accurate

#### User Experience Validation:
- [ ] First-time users complete basic setup in <10 minutes without external help
- [ ] Experienced users locate advanced features within <2 minutes of searching
- [ ] All common workflows have clear, step-by-step instructions
- [ ] Troubleshooting section addresses 95%+ of common real-world issues
- [ ] Code examples are copy-paste ready and work without modification
- [ ] Documentation accessible and readable on mobile devices
- [ ] Visual hierarchy guides users to most important information
- [ ] Search functionality works for all major features and concepts

#### Content Quality Validation:
- [ ] All technical terms defined in glossary or contextually explained
- [ ] Consistent terminology throughout all documentation
- [ ] Progressive disclosure: basic concepts first, advanced topics later
- [ ] Real-world examples that users can relate to their use cases
- [ ] Appropriate balance of conceptual and practical information
- [ ] Inclusive language and examples that work for diverse users
- [ ] Up-to-date information reflecting current codebase state
- [ ] Proper attribution and credits where required

### Automated Testing Requirements:
- [ ] Link validation: All internal and external links functional
- [ ] Code syntax validation: All code blocks properly formatted
- [ ] Image validation: All referenced images exist and are appropriate
- [ ] Command validation: All CLI commands syntactically correct
- [ ] Configuration validation: All config examples properly formatted
- [ ] Cross-reference validation: All internal references resolve correctly

### User Testing Protocol:
1. **Recruitment**: 5-7 users representing target audience segments
2. **Tasks**: Define specific documentation-related tasks to complete
3. **Metrics**: Time to completion, success rate, satisfaction scores
4. **Feedback Collection**: Structured interviews and surveys
5. **Iteration**: Update documentation based on findings
6. **Re-testing**: Validate improvements with new user group

### Performance Benchmarks:
- **Load Time**: Documentation pages load in <3 seconds
- **Search Performance**: Search results return in <1 second
- **Navigation Efficiency**: Users find information in <3 clicks
- **Mobile Responsiveness**: All content accessible on mobile devices
- **Accessibility Score**: WCAG 2.1 AA compliance minimum

## Delivery Requirements

### Documentation Deliverables:
1. **Complete Documentation Set**: All files listed in File Organization
2. **Navigation Structure**: Table of contents with working links
3. **Code Examples Repository**: Working examples users can run
4. **Screenshots/Diagrams**: Visual aids for complex workflows
5. **Validation Report**: Summary of testing and validation results
6. **Maintenance Guide**: How to update and extend the documentation

### Success Metrics:
- **User Onboarding Time**: <10 minutes for basic setup without external assistance
- **Documentation Coverage**: 100% of public APIs, CLI commands, and features documented
- **Example Success Rate**: 95%+ of code examples work without modification on target platforms
- **User Satisfaction**: Average rating of 4.5+ on clarity and helpfulness surveys
- **Maintenance Burden**: Documentation updates require <2 hours per new feature
- **Search Efficiency**: Users find required information in <3 minutes using search
- **Error Reduction**: Documentation reduces support requests by 50%+
- **Adoption Rate**: New users successfully use key features on first attempt

### Quality Gates for Documentation Approval:
1. **Technical Review**: All technical claims verified by subject matter experts
2. **Editorial Review**: Professional editing for clarity, consistency, and style
3. **User Testing**: Validated with representative users from target audience
4. **Accessibility Audit**: WCAG 2.1 AA compliance verified
5. **Cross-Browser Testing**: Documentation renders correctly across browsers
6. **Performance Testing**: Load times and responsiveness measured
7. **SEO Review**: Search optimization for discoverability
8. **Legal Review**: Compliance with licensing, trademarks, and attributions

### Documentation Maintenance Plan:
- **Update Triggers**: New releases, feature additions, API changes, user feedback
- **Review Schedule**: Quarterly reviews for accuracy and relevance
- **Metrics Tracking**: Monitor usage patterns and user engagement
- **Improvement Process**: Regular iteration based on user feedback and analytics
- **Versioning**: Documentation versions aligned with software releases
- **Archival**: Preserve historical documentation for reference
- **Localization**: Plan for internationalization if needed

## Context Integration

### Repository-Specific Context:
- **Monorepo Structure**: Projects are part of a larger monorepo with shared guidelines
- **Development Status**: Substack2Markdown is stable external tool, Personal Capital is actively developed
- **Technology Stack**: Go for CLI tool, Google Apps Script for web application
- **Target Users**: Developers for CLI tool, finance users for Apps Script
- **Integration Points**: Both integrate with external services (Substack API, Google Sheets)
- **Security Considerations**: API keys, authentication, data privacy

### Existing Documentation:
- **Substack2Markdown**: Has basic README, needs expansion and enhancement
- **Personal Capital**: Has comprehensive README, needs better organization and examples
- **Gaps to Address**: Both need more code examples, troubleshooting, and advanced usage guides

---

**Generate comprehensive documentation for both Substack2Markdown and Personal Capital projects following this detailed specification. Focus on creating documentation that is accurate, complete, user-friendly, and maintainable.**
