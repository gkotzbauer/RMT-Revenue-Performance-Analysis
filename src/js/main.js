// ============================================================================
// Healthcare Revenue Analysis Application - Main Controller
// Advanced Statistical Methodology with Comprehensive Error Handling
// ============================================================================

import { HealthcareAnalyzer } from "./analyzer.js";
import { UIManager } from "./ui-manager.js";
import { ChartManager } from "./charts.js";
import { ExportManager } from "./export.js";
import { 
    formatCurrency, 
    formatPercentage, 
    formatNumber,
    formatFileSize,
    safeParseFloat,
    safeParseInt,
    isExcelFile,
    generateId,
    debounce,
    deepClone,
    calculatePercentageChange,
    isEmpty,
    retryWithBackoff
} from "./utils.js";

/**
 * Healthcare Revenue Analysis Application Controller
 * Orchestrates all components and manages application lifecycle
 */
export class HealthcareRevenueApp {
    /**
     * Initialize the Healthcare Revenue Analysis Application
     */
    constructor() {
        console.log('🏗️ Initializing Healthcare Revenue Analysis Application...');
        
        // Verify Chart.js is loaded
        if (typeof Chart === 'undefined') {
            throw new Error('Chart.js library is not loaded. Please ensure it is loaded before the application script.');
        }
        
        // Verify DOM is ready
        if (document.readyState !== 'complete') {
            throw new Error('DOM is not fully loaded. Please ensure the script is loaded after DOM is ready.');
        }
        
        // Application state
        this.currentData = null;
        this.analysisResults = null;
        this.isProcessing = false;
        this.applicationId = generateId('healthcare-app');
        
        // Component instances
        this.analyzer = null;
        this.uiManager = null;
        this.chartManager = null;
        this.exportManager = null;
        
        // Configuration
        this.config = {
            maxFileSize: 50 * 1024 * 1024, // 50MB
            supportedFormats: ['.xlsx', '.xls'],
            retryAttempts: 3,
            analysisTimeout: 300000, // 5 minutes
            debounceDelay: 300
        };
        
        // Event handlers with debouncing
        this.debouncedFileHandler = debounce(this.handleFileSelect.bind(this), this.config.debounceDelay);
        this.debouncedAnalysis = debounce(this.runAnalysis.bind(this), this.config.debounceDelay);
        
        try {
            this.initializeComponents();
            this.init();
        } catch (error) {
            this.handleConstructorError(error);
        }
    }

    /**
     * Initialize component instances with error handling
     */
    initializeComponents() {
        console.log('🔧 Initializing application components...');
        
        try {
            // Create component instances
            this.analyzer = new HealthcareAnalyzer();
            console.log('✅ HealthcareAnalyzer initialized');
            
            this.uiManager = new UIManager();
            console.log('✅ UIManager initialized');
            
            this.chartManager = new ChartManager();
            console.log('✅ ChartManager initialized');
            
            this.exportManager = new ExportManager();
            console.log('✅ ExportManager initialized');
            
        } catch (error) {
            console.error('❌ Component initialization failed:', error);
            throw new Error(`Failed to initialize components: ${error.message}`);
        }
    }

    /**
     * Main application initialization
     */
    async init() {
        console.log('🚀 Starting application initialization...');
        
        try {
            // Validate environment
            await this.validateEnvironment();
            
            // Initialize components
            await this.initializeManagers();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize UI state
            this.initializeUIState();
            
            // Show welcome message
            this.displayWelcomeMessage();
            
            console.log('✅ Application initialization completed successfully');
            
        } catch (error) {
            console.error('❌ Application initialization failed:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Validate required libraries and environment
     */
    async validateEnvironment() {
        console.log('🔍 Validating application environment...');
        
        const requiredLibraries = {
            'XLSX': typeof XLSX !== 'undefined',
            'Chart.js': typeof Chart !== 'undefined',
            'Lodash': typeof _ !== 'undefined'
        };
        
        console.log('📚 Library availability check:', requiredLibraries);
        
        const missingLibraries = Object.entries(requiredLibraries)
            .filter(([name, available]) => !available)
            .map(([name]) => name);
        
        if (missingLibraries.length > 0) {
            throw new Error(`Missing required libraries: ${missingLibraries.join(', ')}`);
        }
        
        // Validate browser capabilities
        const browserSupport = {
            fileAPI: typeof FileReader !== 'undefined',
            promises: typeof Promise !== 'undefined',
            fetch: typeof fetch !== 'undefined',
            canvas: !!document.createElement('canvas').getContext
        };
        
        const unsupportedFeatures = Object.entries(browserSupport)
            .filter(([feature, supported]) => !supported)
            .map(([feature]) => feature);
        
        if (unsupportedFeatures.length > 0) {
            throw new Error(`Browser doesn't support required features: ${unsupportedFeatures.join(', ')}`);
        }
        
        // Verify chart containers exist and are visible
        const chartContainers = [
            'overviewChart',
            'performanceChart',
            'trendsChart',
            'payerChart',
            'correlationChart'
        ];
        
        for (const id of chartContainers) {
            const container = document.getElementById(id);
            if (!container) {
                throw new Error(`Chart container ${id} not found`);
            }
            
            const chartContainer = container.closest('.chart-container');
            if (!chartContainer) {
                throw new Error(`Chart container wrapper for ${id} not found`);
            }
            
            // Force container to be visible and have dimensions
            chartContainer.style.display = 'block';
            chartContainer.style.height = '400px';
            chartContainer.style.width = '100%';
            chartContainer.style.visibility = 'visible';
            chartContainer.style.opacity = '1';
            
            // Force a reflow
            chartContainer.offsetHeight;
            chartContainer.classList.add('visible');
            
            // Verify container has dimensions
            const rect = chartContainer.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {
                throw new Error(`Chart container ${id} has zero dimensions`);
            }
        }
        
        console.log('✅ Environment validation completed');
    }

    /**
     * Initialize all manager components
     */
    async initializeManagers() {
        console.log('🔧 Initializing manager components...');
        
        try {
            // Initialize managers in sequence
            await this.uiManager.init();
            console.log('✅ UI Manager initialized');
            
            await this.chartManager.init();
            console.log('✅ Chart Manager initialized');
            
            await this.exportManager.init();
            console.log('✅ Export Manager initialized');
            
            // Note: Analyzer doesn't need async init
            console.log('✅ All managers initialized successfully');
            
        } catch (error) {
            console.error('❌ Manager initialization failed:', error);
            throw error;
        }
    }

    /**
     * Setup comprehensive event listeners
     */
    setupEventListeners() {
        console.log('🔗 Setting up event listeners...');
        
        try {
            // File handling events
            this.setupFileHandlingEvents();
            
            // Analysis control events
            this.setupAnalysisEvents();
            
            // Export events
            this.setupExportEvents();
            
            // Navigation events
            this.setupNavigationEvents();
            
            // Application control events
            this.setupApplicationEvents();
            
            // Global error handling
            this.setupGlobalErrorHandling();
            
            console.log('✅ All event listeners configured');
            
        } catch (error) {
            console.error('❌ Event listener setup failed:', error);
            throw error;
        }
    }

    /**
     * Setup file handling events (upload, drag & drop)
     */
    setupFileHandlingEvents() {
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                console.log('📁 File input changed');
                this.debouncedFileHandler(e);
            });
            
            // Security: Reset input value after processing
            fileInput.addEventListener('click', () => {
                fileInput.value = '';
            });
        }
        
        if (uploadArea) {
            // Click to browse
            uploadArea.addEventListener('click', () => {
                console.log('🖱️ Upload area clicked');
                fileInput?.click();
            });
            
            // Drag and drop functionality
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadArea.classList.add('dragover');
            });
            
            uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadArea.classList.remove('dragover');
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadArea.classList.remove('dragover');
                this.handleFileDrop(e);
            });
        }
        
        console.log('📂 File handling events configured');
    }

    /**
     * Setup analysis control events
     */
    setupAnalysisEvents() {
        const runAnalysisBtn = document.getElementById('runAnalysisBtn');
        
        if (runAnalysisBtn) {
            runAnalysisBtn.addEventListener('click', () => {
                console.log('🚀 Analysis button clicked');
                this.debouncedAnalysis();
            });
        }
        
        console.log('🔬 Analysis events configured');
    }

    /**
     * Setup export events
     */
    setupExportEvents() {
        const exportCsvBtn = document.getElementById('exportCsvBtn');
        const exportPdfBtn = document.getElementById('exportPdfBtn');
        
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', () => {
                console.log('📋 CSV export requested');
                this.exportResults('csv');
            });
        }
        
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => {
                console.log('📄 PDF export requested');
                this.exportResults('pdf');
            });
        }
        
        console.log('📤 Export events configured');
    }

    /**
     * Setup navigation events
     */
    setupNavigationEvents() {
        const navTabs = document.querySelectorAll('.nav-tab');
        
        navTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                console.log(`📑 Tab navigation: ${tabName}`);
                this.switchTab(tabName);
            });
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.switchTab('overview');
                        break;
                    case '2':
                        e.preventDefault();
                        this.switchTab('performance');
                        break;
                    case '3':
                        e.preventDefault();
                        this.switchTab('trends');
                        break;
                    case '4':
                        e.preventDefault();
                        this.switchTab('insights');
                        break;
                    case '5':
                        e.preventDefault();
                        this.switchTab('data');
                        break;
                }
            }
        });
        
        console.log('🧭 Navigation events configured');
    }

    /**
     * Setup application control events
     */
    setupApplicationEvents() {
        const resetBtn = document.getElementById('resetBtn');
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                console.log('🔄 Application reset requested');
                this.resetApplication();
            });
        }
        
        // Window beforeunload for data protection
        window.addEventListener('beforeunload', (e) => {
            if (this.currentData || this.analysisResults) {
                e.preventDefault();
                e.returnValue = 'You have unsaved analysis data. Are you sure you want to leave?';
                return e.returnValue;
            }
        });
        
        // Window resize handling
        window.addEventListener('resize', debounce(() => {
            this.handleWindowResize();
        }, 250));
        
        console.log('⚙️ Application control events configured');
    }

    /**
     * Setup global error handling
     */
    setupGlobalErrorHandling() {
        // Global error handler
        window.addEventListener('error', (e) => {
            console.error('🚨 Global error caught:', e.error);
            this.handleGlobalError(e.error, e);
        });
        
        // Promise rejection handler
        window.addEventListener('unhandledrejection', (e) => {
            console.error('🚨 Unhandled promise rejection:', e.reason);
            this.handlePromiseRejection(e.reason, e);
        });
        
        console.log('🛡️ Global error handling configured');
    }

    /**
     * Initialize UI state
     */
    initializeUIState() {
        console.log('🎨 Initializing UI state...');
        
        // Reset all UI elements to initial state
        this.uiManager.reset();
        
        // Disable analysis button initially
        this.uiManager.disableAnalysisButton();
        
        // Set initial tab
        this.switchTab('overview');
        
        console.log('✅ UI state initialized');
    }

    /**
     * Display welcome message
     */
    displayWelcomeMessage() {
        const message = 'Welcome to RMT Healthcare Revenue Analysis. Upload your Excel file to begin statistical analysis.';
        this.uiManager.showStatus(message, 'info');
        console.log('👋 Welcome message displayed');
    }

    /**
     * Handle file selection from input
     * @param {Event} event - File input change event
     */
    async handleFileSelect(event) {
        console.log('📁 Processing file selection...');
        
        const file = event.target.files[0];
        if (!file) {
            console.log('ℹ️ No file selected');
            return;
        }
        
        await this.processSelectedFile(file);
    }

    /**
     * Handle file drop
     * @param {DragEvent} event - Drop event
     */
    async handleFileDrop(event) {
        console.log('📁 Processing dropped file...');
        
        const files = event.dataTransfer.files;
        if (files.length === 0) {
            console.log('ℹ️ No files dropped');
            return;
        }
        
        if (files.length > 1) {
            this.uiManager.showStatus('Please drop only one file at a time', 'warning');
            return;
        }
        
        await this.processSelectedFile(files[0]);
    }

    /**
     * Process selected file with comprehensive validation
     * @param {File} file - Selected file
     */
    async processSelectedFile(file) {
        console.log('📊 Processing file:', {
            name: file.name,
            size: formatFileSize(file.size),
            type: file.type,
            lastModified: new Date(file.lastModified).toISOString()
        });
        
        try {
            // Security and validation checks
            await this.validateFile(file);
            
            // Show processing status
            this.uiManager.showLoading('Reading and validating Excel file...');
            this.uiManager.updateProgress(10);
            
            // Process file with retry mechanism
            const data = await retryWithBackoff(
                () => this.analyzer.loadExcelFile(file),
                this.config.retryAttempts
            );
            
            this.uiManager.updateProgress(50);
            
            // Validate processed data
            await this.validateProcessedData(data);
            
            this.uiManager.updateProgress(80);
            
            // Update application state
            this.currentData = data;
            this.analysisResults = null; // Clear previous results
            
            // Update UI
            this.uiManager.updateProgress(100);
            this.uiManager.hideLoading();
            
            // Show file info
            this.uiManager.showFileInfo(file.name, data);
            
            // Enable analysis button
            this.uiManager.enableAnalysisButton();
            
            // Success message
            const message = `✅ File loaded successfully: ${formatNumber(data.length)} records found`;
            this.uiManager.showStatus(message, 'success');
            
            console.log('✅ File processing completed successfully');
            
            // Run analysis
            await this.runAnalysis();
            
            // Display analysis results
            if (this.analysisResults) {
                await this.displayAnalysisResults(this.analysisResults);
            }
            
        } catch (error) {
            console.error('❌ File processing failed:', error);
            this.uiManager.hideLoading();
            this.handleFileProcessingError(error);
        }
    }

    /**
     * Comprehensive file validation
     * @param {File} file - File to validate
     */
    async validateFile(file) {
        console.log('🔍 Validating file...');
        
        // File size validation
        if (file.size > this.config.maxFileSize) {
            throw new Error(`File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(this.config.maxFileSize)})`);
        }
        
        if (file.size === 0) {
            throw new Error('File is empty');
        }
        
        // File type validation
        if (!isExcelFile(file)) {
            throw new Error(`Invalid file type. Please upload an Excel file (${this.config.supportedFormats.join(', ')})`);
        }
        
        // File name validation
        if (file.name.length > 255) {
            throw new Error('File name is too long');
        }
        
        console.log('✅ File validation passed');
    }

    /**
     * Validate processed data
     * @param {Array} data - Processed data array
     */
    async validateProcessedData(data) {
        console.log('🔍 Validating processed data...');
        
        if (!Array.isArray(data)) {
            throw new Error('Invalid data format: Expected array');
        }
        
        if (data.length === 0) {
            throw new Error('No data found in the Excel file');
        }
        
        if (data.length < 5) {
            throw new Error('Insufficient data for analysis (minimum 5 records required)');
        }
        
        // Validate data structure
        const requiredFields = ['year', 'week', 'payer', 'totalPayments'];
        const sampleRecord = data[0];
        
        for (const field of requiredFields) {
            if (!(field in sampleRecord)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        
        console.log('✅ Data validation passed');
    }

    /**
     * Run comprehensive analysis
     */
    async runAnalysis() {
        if (this.isProcessing) {
            console.log('⚠️ Analysis already in progress');
            return;
        }
        
        if (!this.currentData) {
            this.uiManager.showStatus('Please upload an Excel file first', 'warning');
            return;
        }
        
        console.log('🔬 Starting comprehensive statistical analysis...');
        
        try {
            this.isProcessing = true;
            
            // Show analysis progress
            this.uiManager.showLoading('Running statistical analysis with proper train/test split...');
            this.uiManager.updateProgress(0);
            
            // Create analysis timeout
            const analysisPromise = this.analyzer.runCompleteAnalysis(
                this.currentData,
                (progress) => this.uiManager.updateProgress(progress)
            );
            
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Analysis timeout')), this.config.analysisTimeout);
            });
            
            // Run analysis with timeout
            const results = await Promise.race([analysisPromise, timeoutPromise]);
            
            // Validate results
            await this.validateAnalysisResults(results);
            
            // Update application state
            this.analysisResults = deepClone(results);
            
            // Success message
            const accuracy = results.benchmarks?.avgAccuracy || 'N/A';
            const model = results.bestModel?.modelName || 'Unknown';
            const message = `✅ Analysis complete! Best model: ${model} with ${accuracy} accuracy`;
            
            this.uiManager.hideLoading();
            this.uiManager.showStatus(message, 'success');
            
            console.log('✅ Statistical analysis completed successfully');
            
            return results;
            
        } catch (error) {
            console.error('❌ Analysis failed:', error);
            this.uiManager.hideLoading();
            this.handleAnalysisError(error);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Validate analysis results
     * @param {Object} results - Analysis results
     */
    async validateAnalysisResults(results) {
        console.log('🔍 Validating analysis results...');
        
        if (!results || typeof results !== 'object') {
            throw new Error('Invalid analysis results format');
        }
        
        const requiredFields = ['bestModel', 'finalResults', 'benchmarks'];
        for (const field of requiredFields) {
            if (!(field in results)) {
                throw new Error(`Missing required field in results: ${field}`);
            }
        }
        
        if (!Array.isArray(results.finalResults) || results.finalResults.length === 0) {
            throw new Error('No analysis results generated');
        }
        
        console.log('✅ Analysis results validation passed');
    }

    /**
     * Display comprehensive analysis results
     * @param {Object} results - Analysis results
     */
    async displayAnalysisResults(results) {
        console.log('📊 Displaying analysis results...');
        
        try {
            // Validate results before displaying
            if (!results || typeof results !== 'object') {
                throw new Error('Invalid results object');
            }

            // Log the structure of the results
            console.log('Analysis results structure:', {
                hasFinalResults: !!results.finalResults,
                finalResultsLength: results.finalResults?.length,
                hasPerformanceResults: !!results.performanceResults,
                performanceResultsLength: results.performanceResults?.length,
                hasTrainCorrelations: !!results.trainCorrelations,
                sampleFinalResult: results.finalResults?.[0]
            });
            
            // Show analysis container
            const analysisContainer = document.getElementById('analysisContainer');
            if (!analysisContainer) {
                throw new Error('Analysis container not found in DOM');
            }
            
            analysisContainer.style.display = 'block';
            // Force a reflow
            analysisContainer.offsetHeight;
            analysisContainer.classList.add('visible');
            
            // Update metrics displays
            this.updateOverviewMetrics(results);
            this.updatePerformanceMetrics(results);
            
            // Generate visualizations
            console.log('Starting chart generation...');
            await this.generateCharts(results);
            console.log('Chart generation completed');
            
            // Update data tables
            this.updateDataTables(results);
            
            // Switch to overview tab to show results
            this.switchTab('overview');
            
            console.log('✅ Results display completed');
            
        } catch (error) {
            console.error('❌ Results display failed:', error);
            // Display error to user
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = `Failed to display results: ${error.message}`;
            document.querySelector('.analysis-container')?.prepend(errorMessage);
            throw error;
        }
    }

    /**
     * Update overview metrics display
     * @param {Object} results - Analysis results
     */
    updateOverviewMetrics(results) {
        console.log('📈 Updating overview metrics...');
        
        const elements = {
            totalWeeks: document.getElementById('totalWeeks'),
            modelAccuracy: document.getElementById('modelAccuracy'),
            bestModel: document.getElementById('bestModel'),
            avgRevenue: document.getElementById('avgRevenue')
        };
        
        // Update total weeks
        if (elements.totalWeeks && results.benchmarks?.totalWeeks) {
            elements.totalWeeks.textContent = formatNumber(results.benchmarks.totalWeeks);
        }
        
        // Update model accuracy
        if (elements.modelAccuracy && results.benchmarks?.avgAccuracy) {
            elements.modelAccuracy.textContent = results.benchmarks.avgAccuracy;
        }
        
        // Update best model
        if (elements.bestModel && results.bestModel?.modelName) {
            elements.bestModel.textContent = results.bestModel.modelName;
        }
        
        // Calculate and update average revenue
        if (elements.avgRevenue && results.finalResults) {
            const totalRevenue = results.finalResults.reduce((sum, week) => {
                return sum + safeParseFloat(week['Actual Total Payments']);
            }, 0);
            const avgRevenue = totalRevenue / results.finalResults.length;
            elements.avgRevenue.textContent = formatCurrency(avgRevenue);
        }
        
        console.log('✅ Overview metrics updated');
    }

    /**
     * Update performance metrics display
     * @param {Object} results - Analysis results
     */
    updatePerformanceMetrics(results) {
        console.log('📊 Updating performance metrics...');
        
        // Calculate performance distribution
        const performanceDistribution = results.performanceResults.reduce((acc, week) => {
            const diagnostic = week.performanceDiagnostic;
            acc[diagnostic] = (acc[diagnostic] || 0) + 1;
            return acc;
        }, {});
        
        const total = results.performanceResults.length;
        
        const elements = {
            overPerformed: document.getElementById('overPerformed'),
            averagePerformed: document.getElementById('averagePerformed'),
            underPerformed: document.getElementById('underPerformed'),
            modelMAE: document.getElementById('modelMAE'),
            overPerformedPct: document.getElementById('overPerformedPct'),
            averagePerformedPct: document.getElementById('averagePerformedPct'),
            underPerformedPct: document.getElementById('underPerformedPct')
        };
        
        // Update counts
        if (elements.overPerformed) {
            elements.overPerformed.textContent = formatNumber(performanceDistribution['Over Performed'] || 0);
        }
        
        if (elements.averagePerformed) {
            elements.averagePerformed.textContent = formatNumber(performanceDistribution['Average Performance'] || 0);
        }
        
        if (elements.underPerformed) {
            elements.underPerformed.textContent = formatNumber(performanceDistribution['Under Performed'] || 0);
        }
        
        if (elements.modelMAE && results.bestModel?.mae) {
            elements.modelMAE.textContent = formatCurrency(results.bestModel.mae);
        }
        
        // Update percentages
        if (elements.overPerformedPct) {
            const pct = ((performanceDistribution['Over Performed'] || 0) / total);
            elements.overPerformedPct.textContent = formatPercentage(pct);
        }
        
        if (elements.averagePerformedPct) {
            const pct = ((performanceDistribution['Average Performance'] || 0) / total);
            elements.averagePerformedPct.textContent = formatPercentage(pct);
        }
        
        if (elements.underPerformedPct) {
            const pct = ((performanceDistribution['Under Performed'] || 0) / total);
            elements.underPerformedPct.textContent = formatPercentage(pct);
        }
        
        console.log('✅ Performance metrics updated');
    }

    /**
     * Generate all charts and visualizations
     * @param {Object} results - Analysis results
     */
    async generateCharts(results) {
        console.log('📈 Generating charts and visualizations...');
        
        try {
            // Generate charts in sequence to avoid conflicts
            await this.chartManager.generateOverviewChart(results);
            await this.chartManager.generatePerformanceChart(results);
            await this.chartManager.generateTrendsChart(results);
            await this.chartManager.generatePayerChart(results);
            await this.chartManager.generateCorrelationChart(results);
            
            console.log('✅ All charts generated successfully');
            
        } catch (error) {
            console.error('❌ Chart generation failed:', error);
            // Don't throw - charts are not critical for core functionality
            this.uiManager.showStatus('Charts could not be generated', 'warning');
        }
    }

    /**
     * Update data tables with results
     * @param {Object} results - Analysis results
     */
    updateDataTables(results) {
        console.log('📋 Updating data tables...');
        
        try {
            this.updateInsightsTable(results);
            this.updateMainDataTable(results);
            
            console.log('✅ Data tables updated');
            
        } catch (error) {
            console.error('❌ Data table update failed:', error);
            this.uiManager.showStatus('Data tables could not be updated', 'warning');
        }
    }

    /**
     * Update insights table
     * @param {Object} results - Analysis results
     */
    updateInsightsTable(results) {
        const tableBody = document.getElementById('insightsTableBody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        const displayResults = results.finalResults.slice(0, 10);
        
        displayResults.forEach(week => {
            const row = document.createElement('tr');
            const performanceClass = week['Performance Diagnostic']
                .toLowerCase()
                .replace(/\s+/g, '-');
            
            row.innerHTML = `
                <td>${week.Year}-${week.Week}</td>
                <td><span class="performance-indicator ${performanceClass}">${week['Performance Diagnostic']}</span></td>
                <td>${week['What Went Well'] || 'Standard performance'}</td>
                <td>${week['What Could Be Improved'] || 'Continue current practices'}</td>
            `;
            
            tableBody.appendChild(row);
        });
    }

    /**
     * Update main data table
     * @param {Object} results - Analysis results
     */
    updateMainDataTable(results) {
        const tableBody = document.getElementById('dataTableBody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        results.finalResults.forEach(week => {
            const row = document.createElement('tr');
            const performanceClass = week['Performance Diagnostic']
                .toLowerCase()
                .replace(/\s+/g, '-');
            
            const actualPayments = safeParseFloat(week['Actual Total Payments']);
            const predictedPayments = safeParseFloat(week['Predicted Total Payments']);
            const absoluteError = safeParseFloat(week['Absolute Error']);
            
            row.innerHTML = `
                <td>${week.Year}</td>
                <td>${week.Week}</td>
                <td>${formatCurrency(actualPayments)}</td>
                <td>${formatCurrency(predictedPayments)}</td>
                <td>${formatCurrency(absoluteError)}</td>
                <td><span class="performance-indicator ${performanceClass}">${week['Performance Diagnostic']}</span></td>
                <td>${week['Most Influential Performance Factors'] || 'N/A'}</td>
            `;
            
            tableBody.appendChild(row);
        });
    }

    /**
     * Switch between application tabs
     * @param {string} tabName - Target tab name
     */
    switchTab(tabName) {
        console.log(`🔄 Switching to tab: ${tabName}`);
        
        try {
            // Hide all tab contents
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Remove active class from all nav tabs
            const navTabs = document.querySelectorAll('.nav-tab');
            navTabs.forEach(tab => tab.classList.remove('active'));
            
            // Show selected tab content
            const selectedContent = document.getElementById(tabName);
            if (selectedContent) {
                selectedContent.classList.add('active');
            }
            
            // Activate corresponding nav tab
            const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
            if (selectedTab) {
                selectedTab.classList.add('active');
            }
            
            // Update URL hash for navigation state
            if (history.replaceState) {
                history.replaceState(null, null, `#${tabName}`);
            }
            
            console.log(`✅ Tab switched to: ${tabName}`);
            
        } catch (error) {
            console.error('❌ Tab switching failed:', error);
        }
    }

    /**
     * Export analysis results
     * @param {string} format - Export format ('csv' or 'pdf')
     */
    async exportResults(format) {
        if (!this.analysisResults) {
            this.uiManager.showStatus('No analysis results to export. Please run analysis first.', 'warning');
            return;
        }
        
        console.log(`📤 Starting ${format.toUpperCase()} export...`);
        
        try {
            this.uiManager.showLoading(`Preparing ${format.toUpperCase()} export...`);
            
            await this.exportManager.exportResults(this.analysisResults, format);
            
            this.uiManager.hideLoading();
            this.uiManager.showStatus(`✅ Results exported as ${format.toUpperCase()} successfully!`, 'success');
            
            console.log(`✅ ${format.toUpperCase()} export completed`);
            
        } catch (error) {
            console.error(`❌ ${format.toUpperCase()} export failed:`, error);
            this.uiManager.hideLoading();
            this.uiManager.showStatus(`Export failed: ${error.message}`, 'error');
        }
    }

    /**
     * Reset application to initial state
     */
    async resetApplication() {
        console.log('🔄 Resetting application...');
        
        try {
            // Confirm reset if data exists
            if ((this.currentData || this.analysisResults) && !confirm('This will clear all data and analysis results. Continue?')) {
                return;
            }
            
            // Clear application state
            this.currentData = null;
            this.analysisResults = null;
            this.isProcessing = false;
            
            // Reset UI components
            this.uiManager.reset();
            this.chartManager.reset();
            
            // Reset file input
            const fileInput = document.getElementById('fileInput');
            if (fileInput) {
                fileInput.value = '';
            }
            
            // Reset to initial tab
            this.switchTab('overview');
            
            // Show welcome message
            this.displayWelcomeMessage();
            
            console.log('✅ Application reset completed');
            
        } catch (error) {
            console.error('❌ Application reset failed:', error);
            this.uiManager.showStatus('Reset failed: ' + error.message, 'error');
        }
    }

    /**
     * Handle window resize events
     */
    handleWindowResize() {
        console.log('📐 Handling window resize...');
        
        try {
            // Update chart sizes
            if (this.chartManager) {
                this.chartManager.updateChartSizes();
            }
            
            // Update UI layout
            if (this.uiManager) {
                this.uiManager.handleResize();
            }
            
        } catch (error) {
            console.error('❌ Window resize handling failed:', error);
        }
    }

    // Error Handling Methods

    /**
     * Handle constructor errors
     * @param {Error} error - Constructor error
     */
    handleConstructorError(error) {
        console.error('❌ Constructor error:', error);
        
        const statusContainer = document.getElementById('statusContainer');
        if (statusContainer) {
            statusContainer.innerHTML = `
                <div class="status-message error">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>Application failed to initialize: ${error.message}</span>
                </div>
            `;
        }
    }

    /**
     * Handle initialization errors
     * @param {Error} error - Initialization error
     */
    handleInitializationError(error) {
        console.error('❌ Initialization error:', error);
        
        if (this.uiManager) {
            this.uiManager.showStatus(`Initialization failed: ${error.message}`, 'error');
        } else {
            alert(`Application initialization failed: ${error.message}`);
        }
    }

    /**
     * Handle file processing errors
     * @param {Error} error - File processing error
     */
    handleFileProcessingError(error) {
        console.error('❌ File processing error:', error);
        
        let userMessage = 'File processing failed';
        
        if (error.message.includes('Missing required libraries')) {
            userMessage = 'Required libraries not loaded. Please refresh the page and try again.';
        } else if (error.message.includes('Invalid file type')) {
            userMessage = 'Please upload a valid Excel file (.xlsx or .xls)';
        } else if (error.message.includes('File size')) {
            userMessage = error.message;
        } else {
            userMessage = `File processing failed: ${error.message}`;
        }
        
        this.uiManager.showStatus(userMessage, 'error');
    }

    /**
     * Handle analysis errors
     * @param {Error} error - Analysis error
     */
    handleAnalysisError(error) {
        console.error('❌ Analysis error:', error);
        
        let userMessage = 'Analysis failed';
        
        if (error.message.includes('timeout')) {
            userMessage = 'Analysis timed out. Please try with a smaller dataset.';
        } else if (error.message.includes('Insufficient data')) {
            userMessage = error.message;
        } else {
            userMessage = `Analysis failed: ${error.message}`;
        }
        
        this.uiManager.showStatus(userMessage, 'error');
    }

    /**
     * Handle global application errors
     * @param {Error} error - Global error
     * @param {ErrorEvent} event - Error event
     */
    handleGlobalError(error, event) {
        console.error('🚨 Global error:', error, event);
        
        // Don't show every global error to user, just log it
        // Only show critical errors that affect functionality
        if (error.message && error.message.includes('ChunkLoadError')) {
            this.uiManager.showStatus('Application update detected. Please refresh the page.', 'warning');
        }
    }

    /**
     * Handle promise rejections
     * @param {any} reason - Rejection reason
     * @param {PromiseRejectionEvent} event - Rejection event
     */
    handlePromiseRejection(reason, event) {
        console.error('🚨 Unhandled promise rejection:', reason, event);
        
        // Prevent default handling
        event.preventDefault();
        
        // Log for debugging but don't always show to user
        if (reason && reason.message && reason.message.includes('Network')) {
            this.uiManager.showStatus('Network error occurred. Please check your connection.', 'warning');
        }
    }

    initializeFilterListener() {
        window.addEventListener('filterChange', (event) => {
            const { weeks, performances } = event.detail;
            this.applyFilters(weeks, performances);
        });
    }

    applyFilters(selectedWeeks, selectedPerformances) {
        if (!this.currentData || !this.analysisResults) return;

        // Filter the data based on selected criteria
        let filteredData = [...this.currentData];
        
        // Apply week filter if weeks are selected
        if (selectedWeeks.length > 0) {
            filteredData = filteredData.filter(record => 
                selectedWeeks.includes(`${record.year}-${record.week}`)
            );
        }
        
        // Apply performance filter if performances are selected
        if (selectedPerformances.length > 0) {
            filteredData = filteredData.filter(record => {
                const performance = this.analyzer.calculatePerformance(record);
                return selectedPerformances.includes(performance);
            });
        }

        // Update UI with filtered data
        this.updateUIWithFilteredData(filteredData);
    }

    updateUIWithFilteredData(filteredData) {
        // Update metrics
        const metrics = this.analyzer.calculateMetrics(filteredData);
        this.uiManager.updateOverviewMetrics(metrics);
        
        // Update charts
        this.uiManager.generateRevenueChart(filteredData);
        this.uiManager.generatePerformanceChart(filteredData);
        this.uiManager.generateTrendChart(filteredData);
        
        // Update tables
        this.uiManager.updateDataTable(filteredData);
    }
}

// Application Initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing Healthcare Revenue Analysis Application...');
    
    try {
        // Add small delay to ensure all external libraries are loaded
        setTimeout(() => {
            console.log('📱 Creating HealthcareRevenueApp instance...');
            window.healthcareApp = new HealthcareRevenueApp();
            console.log('✅ Healthcare Revenue Analysis Application initialized successfully');
        }, 500);
        
    } catch (error) {
        console.error('❌ Failed to initialize application:', error);
        
        // Fallback error display
        const statusContainer = document.getElementById('statusContainer');
        if (statusContainer) {
            statusContainer.innerHTML = `
                <div class="status-message error">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>Critical error: Application failed to start. ${error.message}</span>
                </div>
            `;
        }
    }
});
