// ============================================================================
// RMT Healthcare Revenue Analysis - Main Application Controller
// Advanced Statistical Methodology with Proper Train/Test Split
// ============================================================================

import { HealthcareAnalyzer } from './analyzer.js';
import { UIManager } from './ui-manager.js';
import { ChartManager } from './charts.js';
import { ExportManager } from './export.js';

export class HealthcareRevenueApp {
    constructor() {
        this.analyzer = new HealthcareAnalyzer();
        this.uiManager = new UIManager();
        this.chartManager = new ChartManager();
        this.exportManager = new ExportManager();
        
        this.currentData = null;
        this.analysisResults = null;
        
        this.init();
    }

    init() {
        console.log('🏥 Initializing RMT Healthcare Revenue Analysis Tool');
        
        // Check if required libraries are available
        const requiredLibraries = {
            'XLSX': typeof XLSX !== 'undefined',
            'Chart': typeof Chart !== 'undefined',
            'lodash (_)': typeof _ !== 'undefined'
        };
        
        console.log('📚 Library availability check:', requiredLibraries);
        
        const missingLibraries = Object.entries(requiredLibraries)
            .filter(([name, available]) => !available)
            .map(([name]) => name);
            
        if (missingLibraries.length > 0) {
            console.error('❌ Missing required libraries:', missingLibraries);
            this.showError('Missing Dependencies', `Required libraries not loaded: ${missingLibraries.join(', ')}`);
            return;
        }
        
        try {
            // Initialize UI components
            console.log('🎨 Initializing UI Manager...');
            this.uiManager.init();
            
            console.log('📊 Initializing Chart Manager...');
            this.chartManager.init();
            
            console.log('📋 Initializing Export Manager...');  
            this.exportManager.init();
            
            // Bind events
            console.log('🔗 Binding events...');
            this.bindEvents();
            
            // Show welcome message
            this.showWelcomeMessage();
            
            console.log('✅ Application initialized successfully');
            
        } catch (error) {
            console.error('❌ Initialization error:', error);
            this.showError('Initialization Failed', error.message);
        }
    }

    showError(title, message) {
        if (this.uiManager && this.uiManager.showStatus) {
            this.uiManager.showStatus(`${title}: ${message}`, 'error');
        } else {
            console.error(`${title}: ${message}`);
            alert(`${title}: ${message}`);
        }
    }

    bindEvents() {
        console.log('🔗 Binding events...');
        
        // File upload handling
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        const runAnalysisBtn = document.getElementById('runAnalysisBtn');
        const resetBtn = document.getElementById('resetBtn');

        console.log('Elements found:', {
            fileInput: !!fileInput,
            uploadArea: !!uploadArea,
            runAnalysisBtn: !!runAnalysisBtn,
            resetBtn: !!resetBtn
        });

        // File input change
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                console.log('📁 File input changed:', e.target.files);
                this.handleFileSelect(e);
            });
            console.log('✅ File input event bound');
        } else {
            console.error('❌ File input element not found');
        }

        // Drag and drop
        if (uploadArea) {
            uploadArea.addEventListener('click', () => {
                console.log('🖱️ Upload area clicked');
                fileInput?.click();
            });
            uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
            uploadArea.addEventListener('drop', (e) => this.handleFileDrop(e));
            console.log('✅ Upload area events bound');
        } else {
            console.error('❌ Upload area element not found');
        }

        // Analysis button
        if (runAnalysisBtn) {
            runAnalysisBtn.addEventListener('click', () => {
                console.log('🚀 Analysis button clicked');
                this.runAnalysis();
            });
            console.log('✅ Analysis button event bound');
        } else {
            console.error('❌ Analysis button element not found');
        }

        // Reset button
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                console.log('🔄 Reset button clicked');
                this.resetApplication();
            });
            console.log('✅ Reset button event bound');
        }

        // Export buttons
        const exportCsvBtn = document.getElementById('exportCsvBtn');
        const exportPdfBtn = document.getElementById('exportPdfBtn');
        
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', () => {
                console.log('📋 CSV export clicked');
                this.exportResults('csv');
            });
            console.log('✅ CSV export event bound');
        }
        
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => {
                console.log('📄 PDF export clicked');
                this.exportResults('pdf');
            });
            console.log('✅ PDF export event bound');
        }

        // Tab navigation
        const navTabs = document.querySelectorAll('.nav-tab');
        console.log('📑 Found nav tabs:', navTabs.length);
        navTabs.forEach((tab, index) => {
            tab.addEventListener('click', (e) => {
                console.log(`📑 Tab clicked: ${e.target.dataset.tab}`);
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        console.log('✅ All events bound successfully');
    }

    showWelcomeMessage() {
        this.uiManager.showStatus('Welcome to RMT Healthcare Revenue Analysis. Upload your Excel file to begin.', 'info');
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        const uploadArea = document.getElementById('uploadArea');
        uploadArea?.classList.add('dragover');
    }

    handleFileDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const uploadArea = document.getElementById('uploadArea');
        uploadArea?.classList.remove('dragover');

        const files = event.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    async processFile(file) {
        console.log('📄 Processing file:', file.name, 'Size:', file.size, 'bytes');
        
        try {
            // Check if XLSX is available
            if (typeof XLSX === 'undefined') {
                throw new Error('XLSX library is not loaded. Please refresh the page and try again.');
            }
            
            console.log('✅ XLSX library is available');
            
            // Validate file type
            if (!this.validateFileType(file)) {
                throw new Error('Please upload an Excel file (.xlsx or .xls)');
            }
            
            console.log('✅ File type validation passed');

            // Show loading state
            this.uiManager.showLoading('Reading Excel file...');
            console.log('📊 Starting file analysis...');

            // Process the file
            const data = await this.analyzer.loadExcelFile(file);
            console.log('✅ File processed, records found:', data.length);
            
            this.currentData = data;

            // Update UI
            this.uiManager.hideLoading();
            this.uiManager.showFileInfo(file, data);
            this.uiManager.enableAnalysisButton();
            
            this.uiManager.showStatus(`✅ File loaded successfully: ${data.length} records found`, 'success');
            
            console.log('✅ File processing completed successfully');

            // Automatically run analysis after loading the file
            await this.runAnalysis();

            document.getElementById('analysisContainer').style.display = 'block';

        } catch (error) {
            console.error('❌ File processing error:', error);
            console.error('Error stack:', error.stack);
            
            this.uiManager.hideLoading();
            this.uiManager.showStatus(`Error processing file: ${error.message}`, 'error');
            
            // Show additional debug info
            console.log('🔍 Debug info:', {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                xlsxAvailable: typeof XLSX !== 'undefined',
                analyzerAvailable: !!this.analyzer
            });
        }
    }

    validateFileType(file) {
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel' // .xls
        ];
        
        const validExtensions = ['.xlsx', '.xls'];
        const fileExtension = file.name.toLowerCase().substr(file.name.lastIndexOf('.'));
        
        return validTypes.includes(file.type) || validExtensions.includes(fileExtension);
    }

    async runAnalysis() {
        if (!this.currentData) {
            this.uiManager.showStatus('Please upload an Excel file first', 'warning');
            return;
        }

        console.log('🔬 Starting statistical analysis...');
        
        try {
            // Show loading
            this.uiManager.showLoading('Running statistical analysis...');
            this.uiManager.updateProgress(0);

            // Run the complete analysis
            const results = await this.analyzer.runCompleteAnalysis(this.currentData, (progress) => {
                this.uiManager.updateProgress(progress);
            });

            this.analysisResults = results;

            // Hide loading
            this.uiManager.hideLoading();

            // Update UI with results
            this.displayResults(results);
            
            // Show success message
            this.uiManager.showStatus(
                `✅ Analysis complete! Best model: ${results.bestModel.modelName} with ${results.benchmarks.avgAccuracy} accuracy`, 
                'success'
            );

            console.log('✅ Analysis completed successfully');

        } catch (error) {
            console.error('❌ Analysis error:', error);
            this.uiManager.hideLoading();
            this.uiManager.showStatus(`Analysis failed: ${error.message}`, 'error');
        }
    }

    displayResults(results) {
        console.log('📊 Displaying analysis results...');
        console.log('🪵 Analysis results object:', results);

        // Update overview metrics
        this.updateOverviewMetrics(results);

        // Update performance metrics
        this.updatePerformanceMetrics(results);

        // Generate charts
        this.chartManager.generateOverviewChart(results);
        this.chartManager.generatePerformanceChart(results);
        this.chartManager.generateTrendsChart(results);
        this.chartManager.generatePayerChart(results);
        this.chartManager.generateCorrelationChart(results);

        // Update data tables
        this.updateDataTables(results);

        // Switch to overview tab
        this.switchTab('overview');

        console.log('✅ Results displayed successfully');
    }

    updateOverviewMetrics(results) {
        const elements = {
            totalWeeks: document.getElementById('totalWeeks'),
            modelAccuracy: document.getElementById('modelAccuracy'),
            bestModel: document.getElementById('bestModel'),
            avgRevenue: document.getElementById('avgRevenue')
        };

        if (elements.totalWeeks) {
            elements.totalWeeks.textContent = results.benchmarks.totalWeeks;
        }
        
        if (elements.modelAccuracy) {
            elements.modelAccuracy.textContent = results.benchmarks.avgAccuracy;
        }
        
        if (elements.bestModel) {
            elements.bestModel.textContent = results.bestModel.modelName;
        }
        
        if (elements.avgRevenue) {
            const avgRevenue = results.finalResults.reduce((sum, week) => 
                sum + parseFloat(week['Actual Total Payments']), 0) / results.finalResults.length;
            elements.avgRevenue.textContent = `$${Math.round(avgRevenue).toLocaleString()}`;
        }
    }

    updatePerformanceMetrics(results) {
        const performanceDistribution = results.performanceResults.reduce((acc, week) => {
            acc[week.performanceDiagnostic] = (acc[week.performanceDiagnostic] || 0) + 1;
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

        if (elements.overPerformed) {
            elements.overPerformed.textContent = performanceDistribution['Over Performed'] || 0;
        }
        
        if (elements.averagePerformed) {
            elements.averagePerformed.textContent = performanceDistribution['Average Performance'] || 0;
        }
        
        if (elements.underPerformed) {
            elements.underPerformed.textContent = performanceDistribution['Under Performed'] || 0;
        }
        
        if (elements.modelMAE) {
            elements.modelMAE.textContent = `$${Math.round(results.bestModel.mae).toLocaleString()}`;
        }

        // Update percentages
        if (elements.overPerformedPct) {
            const pct = ((performanceDistribution['Over Performed'] || 0) / total * 100).toFixed(1);
            elements.overPerformedPct.textContent = `${pct}%`;
        }
        
        if (elements.averagePerformedPct) {
            const pct = ((performanceDistribution['Average Performance'] || 0) / total * 100).toFixed(1);
            elements.averagePerformedPct.textContent = `${pct}%`;
        }
        
        if (elements.underPerformedPct) {
            const pct = ((performanceDistribution['Under Performed'] || 0) / total * 100).toFixed(1);
            elements.underPerformedPct.textContent = `${pct}%`;
        }
    }

    updateDataTables(results) {
        // Update insights table
        const insightsTableBody = document.getElementById('insightsTableBody');
        if (insightsTableBody) {
            insightsTableBody.innerHTML = '';
            
            results.finalResults.slice(0, 10).forEach(week => {
                const row = document.createElement('tr');
                
                const performanceClass = week['Performance Diagnostic'].toLowerCase().replace(/\s+/g, '-');
                
                row.innerHTML = `
                    <td>${week.Year}-${week.Week}</td>
                    <td><span class="performance-indicator ${performanceClass}">${week['Performance Diagnostic']}</span></td>
                    <td>${week['What Went Well'] || 'Standard performance'}</td>
                    <td>${week['What Could Be Improved'] || 'Continue current practices'}</td>
                `;
                
                insightsTableBody.appendChild(row);
            });
        }

        // Update main data table
        const dataTableBody = document.getElementById('dataTableBody');
        if (dataTableBody) {
            dataTableBody.innerHTML = '';
            
            results.finalResults.forEach(week => {
                const row = document.createElement('tr');
                
                const performanceClass = week['Performance Diagnostic'].toLowerCase().replace(/\s+/g, '-');
                
                row.innerHTML = `
                    <td>${week.Year}</td>
                    <td>${week.Week}</td>
                    <td>$${(parseFloat(week['Actual Total Payments']) / parseFloat(week['Visit Count'])).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td>$${parseFloat(week['Actual Total Payments']).toLocaleString()}</td>
                    <td>$${parseFloat(week['Predicted Total Payments']).toLocaleString()}</td>
                    <td>$${parseFloat(week['Absolute Error']).toLocaleString()}</td>
                    <td><span class="performance-indicator ${performanceClass}">${week['Performance Diagnostic']}</span></td>
                    <td>${week['Most Influential Performance Factors']}</td>
                `;
                
                dataTableBody.appendChild(row);
            });
        }
    }

    switchTab(tabName) {
        // Hide all tab contents
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => content.classList.remove('active'));

        // Remove active class from all tabs
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => tab.classList.remove('active'));

        // Show selected tab
        const selectedContent = document.getElementById(tabName);
        const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);

        if (selectedContent) selectedContent.classList.add('active');
        if (selectedTab) selectedTab.classList.add('active');

        console.log(`📑 Switched to ${tabName} tab`);
    }

    async exportResults(format) {
        if (!this.analysisResults) {
            this.uiManager.showStatus('No analysis results to export. Please run analysis first.', 'warning');
            return;
        }

        try {
            this.uiManager.showLoading(`Preparing ${format.toUpperCase()} export...`);
            
            await this.exportManager.exportResults(this.analysisResults, format);
            
            this.uiManager.hideLoading();
            this.uiManager.showStatus(`✅ Results exported as ${format.toUpperCase()} successfully!`, 'success');
            
        } catch (error) {
            console.error('Export error:', error);
            this.uiManager.hideLoading();
            this.uiManager.showStatus(`Export failed: ${error.message}`, 'error');
        }
    }

    resetApplication() {
        console.log('🔄 Resetting application...');
        
        // Clear data
        this.currentData = null;
        this.analysisResults = null;
        
        // Reset UI
        this.uiManager.reset();
        this.chartManager.reset();
        
        // Reset file input
        const fileInput = document.getElementById('fileInput');
        if (fileInput) fileInput.value = '';
        
        // Switch back to overview tab
        this.switchTab('overview');
        
        // Show welcome message
        this.showWelcomeMessage();
        
        console.log('✅ Application reset complete');
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

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing healthcare app...');
    
    try {
        // Wait a moment for external libraries to load
        setTimeout(() => {
            console.log('📱 Creating HealthcareRevenueApp instance...');
            window.healthcareApp = new HealthcareRevenueApp();
            console.log('✅ Healthcare app created and assigned to window.healthcareApp');
        }, 500);
        
    } catch (error) {
        console.error('❌ Failed to initialize healthcare app:', error);
        console.error('Error details:', error.stack);
        
        // Show error to user
        setTimeout(() => {
            const statusContainer = document.getElementById('statusContainer');
            if (statusContainer) {
                statusContainer.innerHTML = `
                    <div class="status-message error">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>Application failed to initialize: ${error.message}</span>
                    </div>
                `;
            }
        }, 100);
    }
});

// Add global error handler
window.addEventListener('error', (e) => {
    console.error('🚨 Global error caught:', e.error);
    console.error('Error details:', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        stack: e.error?.stack
    });
});

