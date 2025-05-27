// ============================================================================
// UI Manager - Healthcare Revenue Analysis Interface
// Handles all user interface interactions and state management
// ============================================================================

export class UIManager {
    constructor() {
        this.loadingOverlay = null;
        this.statusContainer = null;
        this.progressBar = null;
        this.fileInfo = null;
        this.runAnalysisBtn = null;
        this.weekFilter = null;
        this.performanceFilter = null;
        this.currentData = null;
        this.selectedWeeks = new Set();
        this.selectedPerformances = new Set();
    }

    init() {
        console.log('🎨 Initializing UI Manager...');
        
        // Get references to key UI elements
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.statusContainer = document.getElementById('statusContainer');
        this.progressBar = document.getElementById('progressBar');
        this.fileInfo = document.getElementById('fileInfo');
        this.runAnalysisBtn = document.getElementById('runAnalysisBtn');
        this.progressContainer = document.getElementById('progressContainer');
        
        // Initialize custom selects
        this.initializeCustomSelects();
        
        // Initialize console toggle
        this.initializeConsoleToggle();
        
        console.log('✅ UI Manager initialized');
    }

    initializeCustomSelects() {
        // Initialize week filter
        const weekSelect = document.querySelector('.filter-group:first-child .custom-select');
        if (weekSelect) {
            const selected = weekSelect.querySelector('.select-selected');
            const items = weekSelect.querySelector('.select-items');
            
            selected.addEventListener('click', () => {
                items.classList.toggle('select-hide');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!weekSelect.contains(e.target)) {
                    items.classList.add('select-hide');
                }
            });
        }

        // Initialize performance filter
        const performanceSelect = document.querySelector('.filter-group:last-child .custom-select');
        if (performanceSelect) {
            const selected = performanceSelect.querySelector('.select-selected');
            const items = performanceSelect.querySelector('.select-items');
            
            selected.addEventListener('click', () => {
                items.classList.toggle('select-hide');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!performanceSelect.contains(e.target)) {
                    items.classList.add('select-hide');
                }
            });

            // Handle checkbox changes
            const checkboxes = performanceSelect.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    if (checkbox.checked) {
                        this.selectedPerformances.add(checkbox.value);
                    } else {
                        this.selectedPerformances.delete(checkbox.value);
                    }
                    this.updateSelectedText(selected, Array.from(this.selectedPerformances));
                    this.handleFilterChange();
                });
            });
        }
    }

    populateWeekFilter(weeks) {
        const weekOptions = document.querySelector('#weekFilter .select-options');
        if (!weekOptions) return;

        weekOptions.innerHTML = '';
        weeks.forEach(week => {
            const option = document.createElement('div');
            option.className = 'select-option';
            option.innerHTML = `
                <input type="checkbox" id="week_${week}" value="${week}" checked>
                <label for="week_${week}">${week}</label>
            `;
            weekOptions.appendChild(option);
        });

        // Add event listeners for checkboxes
        weekOptions.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    this.selectedWeeks.add(checkbox.value);
                } else {
                    this.selectedWeeks.delete(checkbox.value);
                }
                this.updateSelectedText(document.querySelector('#weekFilter .select-selected'), Array.from(this.selectedWeeks));
                this.handleFilterChange();
            });
        });

        // Initialize with all weeks selected
        this.selectedWeeks = new Set(weeks);
        this.updateSelectedText(document.querySelector('#weekFilter .select-selected'), weeks);
    }

    updateSelectedText(element, selectedValues) {
        if (selectedValues.length === 0) {
            element.textContent = element.dataset.placeholder || 'Select...';
            element.classList.remove('selected');
        } else {
            element.textContent = selectedValues.join(', ');
            element.classList.add('selected');
        }
    }

    handleFilterChange() {
        // Emit filter change event
        const event = new CustomEvent('filterChange', {
            detail: {
                weeks: Array.from(this.selectedWeeks),
                performances: Array.from(this.selectedPerformances)
            }
        });
        window.dispatchEvent(event);
    }

    initializeConsoleToggle() {
        const toggleConsoleBtn = document.getElementById('toggleConsole');
        const consoleContainer = document.getElementById('consoleContainer');
        
        if (toggleConsoleBtn && consoleContainer) {
            toggleConsoleBtn.addEventListener('click', () => {
                const isVisible = consoleContainer.style.display !== 'none';
                consoleContainer.style.display = isVisible ? 'none' : 'block';
                
                const icon = toggleConsoleBtn.querySelector('i');
                if (icon) {
                    icon.className = isVisible ? 'fas fa-eye' : 'fas fa-eye-slash';
                }
                
                toggleConsoleBtn.innerHTML = isVisible ? 
                    '<i class="fas fa-eye"></i> Show' : 
                    '<i class="fas fa-eye-slash"></i> Hide';
            });
        }
    }

    showStatus(message, type = 'info') {
        if (!this.statusContainer) return;

        // Remove existing status messages
        this.statusContainer.innerHTML = '';

        // Create status message element
        const statusMessage = document.createElement('div');
        statusMessage.className = `status-message ${type}`;
        
        // Add appropriate icon
        let icon = 'fas fa-info-circle';
        switch (type) {
            case 'success':
                icon = 'fas fa-check-circle';
                break;
            case 'error':
                icon = 'fas fa-exclamation-circle';
                break;
            case 'warning':
                icon = 'fas fa-exclamation-triangle';
                break;
        }
        
        statusMessage.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
        `;
        
        this.statusContainer.appendChild(statusMessage);
        
        // Auto-remove success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                if (statusMessage.parentNode) {
                    statusMessage.remove();
                }
            }, 5000);
        }

        // Log to console
        window.consoleLog?.(message, type);
    }

    showLoading(message = 'Processing...') {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = 'flex';
            
            const loadingText = this.loadingOverlay.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = message;
            }
        }

        // Show console if not visible
        window.showConsole?.();
    }

    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = 'none';
        }
        
        // Hide progress bar
        if (this.progressContainer) {
            this.progressContainer.style.display = 'none';
        }
    }

    updateProgress(percentage) {
        if (this.progressBar && this.progressContainer) {
            this.progressContainer.style.display = 'block';
            this.progressBar.style.width = `${percentage}%`;
        }
    }

    showFileInfo(fileName, stats) {
        const fileInfo = document.getElementById('fileInfo');
        const fileNameElement = document.getElementById('fileName');
        const fileStatsElement = document.getElementById('fileStats');
        
        if (fileNameElement) {
            fileNameElement.textContent = fileName;
        }
        
        if (fileStatsElement) {
            // Ensure stats is a string
            const statsText = typeof stats === 'string' ? stats : JSON.stringify(stats);
            fileStatsElement.textContent = statsText;
        }
        
        if (fileInfo) {
            fileInfo.style.display = 'block';
            // Force a reflow
            fileInfo.offsetHeight;
            fileInfo.classList.add('visible');
        }
    }

    showAnalysisResults(results) {
        // Show the analysis container
        const analysisContainer = document.getElementById('analysisContainer');
        if (analysisContainer) {
            analysisContainer.style.display = 'block';
            // Force a reflow
            analysisContainer.offsetHeight;
            analysisContainer.classList.add('visible');
        }

        // Update executive summary
        this.updateExecutiveSummary(results);

        // Update key metrics
        this.updateKeyMetrics(results);

        // Update charts
        if (window.healthcareApp?.chartManager) {
            window.healthcareApp.chartManager.generateCharts(results);
        }

        // Update data table
        this.updateDataTable(results);

        // Update action items
        this.updateActionItems(results);
    }

    updateExecutiveSummary(results) {
        const executiveSummary = document.getElementById('executiveSummary');
        const keyInsight = document.getElementById('keyInsight');
        
        if (executiveSummary && results.summary) {
            executiveSummary.innerHTML = `
                <div class="alert alert-success">
                    <h3>${results.summary.title}</h3>
                    <p>${results.summary.description}</p>
                </div>
            `;
        }

        if (keyInsight && results.keyInsight) {
            keyInsight.textContent = results.keyInsight;
        }
    }

    updateKeyMetrics(results) {
        const keyMetrics = document.getElementById('keyMetrics');
        if (!keyMetrics || !results.metrics) return;

        keyMetrics.innerHTML = results.metrics.map(metric => `
            <div class="metric-card">
                <div class="metric-value">${metric.value}</div>
                <div class="metric-label">${metric.label}</div>
            </div>
        `).join('');
    }

    updateDataTable(results) {
        const tableBody = document.getElementById('dataTableBody');
        if (!tableBody || !results.weeklyData) return;

        tableBody.innerHTML = results.weeklyData.map(week => `
            <tr>
                <td>${week.year}</td>
                <td>${week.week}</td>
                <td>${this.formatCurrency(week.actualTotalPayments)}</td>
                <td>${this.formatCurrency(week.predictedTotalPayments)}</td>
                <td>${this.formatCurrency(week.avgPaymentPerVisit)}</td>
                <td>
                    <span class="performance-${this.getPerformanceClass(week.performance)}">
                        ${this.formatPercentage(week.performance)}
                    </span>
                </td>
                <td>${week.mostInfluentialFactors.join(', ')}</td>
            </tr>
        `).join('');
    }

    updateActionItems(results) {
        const actionItems = document.getElementById('actionItems');
        if (!actionItems || !results.recommendations) return;

        actionItems.innerHTML = results.recommendations.map(rec => `
            <div class="action-card">
                <h3>${rec.title}</h3>
                <ul class="action-list">
                    ${rec.items.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
        `).join('');
    }

    getPerformanceClass(performance) {
        if (performance >= 1.1) return 'over';
        if (performance >= 0.9) return 'average';
        return 'under';
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }

    formatPercentage(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }).format(value);
    }

    enableAnalysisButton() {
        if (this.runAnalysisBtn) {
            this.runAnalysisBtn.disabled = false;
            this.runAnalysisBtn.innerHTML = `
                <i class="fas fa-play"></i>
                Run Statistical Analysis
            `;
        }
    }

    disableAnalysisButton() {
        if (this.runAnalysisBtn) {
            this.runAnalysisBtn.disabled = true;
            this.runAnalysisBtn.innerHTML = `
                <i class="fas fa-upload"></i>
                Upload Excel File First
            `;
        }
    }

    reset() {
        console.log('🔄 Resetting UI...');
        
        // Clear status messages
        if (this.statusContainer) {
            this.statusContainer.innerHTML = '';
        }
        
        // Hide file info
        if (this.fileInfo) {
            this.fileInfo.classList.remove('show');
        }
        
        // Reset upload area
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.classList.remove('file-loaded');
        }
        
        // Hide analysis container with animation
        const analysisContainer = document.getElementById('analysisContainer');
        if (analysisContainer) {
            analysisContainer.classList.remove('active');
            // Wait for the fade out animation to complete before hiding
            setTimeout(() => {
                if (!analysisContainer.classList.contains('active')) {
                    analysisContainer.style.display = 'none';
                }
            }, 300); // Match the transition duration
        }
        
        // Disable analysis button
        this.disableAnalysisButton();
        
        // Hide loading and progress
        this.hideLoading();
        
        // Reset all metric displays
        this.resetMetricDisplays();
        
        // Clear data tables
        this.clearDataTables();
        
        console.log('✅ UI reset complete');
    }

    resetMetricDisplays() {
        const metricElements = [
            'totalWeeks', 'modelAccuracy', 'bestModel', 'avgRevenue',
            'overPerformed', 'averagePerformed', 'underPerformed', 'modelMAE',
            'overPerformedPct', 'averagePerformedPct', 'underPerformedPct'
        ];
        
        metricElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = '--';
            }
        });
    }

    clearDataTables() {
        // Clear insights table
        const insightsTableBody = document.getElementById('insightsTableBody');
        if (insightsTableBody) {
            insightsTableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 2rem; color: var(--gray-500);">
                        <i class="fas fa-chart-bar" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                        Run analysis to view insights
                    </td>
                </tr>
            `;
        }

        // Clear main data table
        const dataTableBody = document.getElementById('dataTableBody');
        if (dataTableBody) {
            dataTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: var(--gray-500);">
                        <i class="fas fa-table" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                        Upload data and run analysis to view results
                    </td>
                </tr>
            `;
        }
    }

    showError(title, message, details = null) {
        this.showStatus(`${title}: ${message}`, 'error');
        
        if (details) {
            console.error('Error details:', details);
            window.consoleLog?.(`Error details: ${JSON.stringify(details)}`, 'error');
        }
    }

    showSuccess(message) {
        this.showStatus(message, 'success');
    }

    showWarning(message) {
        this.showStatus(message, 'warning');
    }

    showInfo(message) {
        this.showStatus(message, 'info');
    }

    // Animation utilities
    fadeIn(element, duration = 300) {
        if (!element) return;
        
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = (timestamp - start) / duration;
            
            element.style.opacity = Math.min(progress, 1);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    fadeOut(element, duration = 300) {
        if (!element) return;
        
        let start = null;
        const initialOpacity = parseFloat(getComputedStyle(element).opacity) || 1;
        
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = (timestamp - start) / duration;
            
            element.style.opacity = initialOpacity * (1 - Math.min(progress, 1));
            
            if (progress >= 1) {
                element.style.display = 'none';
            } else {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    // Utility to format numbers for display
    formatNumber(num, decimals = 0) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    }

    // Utility to format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    // Utility to format percentage
    formatPercentage(value, decimals = 1) {
        return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(value);
    }

    // Handle responsive behavior
    handleResize() {
        const isMobile = window.innerWidth < 768;
        const mainContent = document.querySelector('.main-content');
        
        if (mainContent) {
            if (isMobile) {
                mainContent.style.gridTemplateColumns = '1fr';
            } else {
                mainContent.style.gridTemplateColumns = '1fr 2fr';
            }
        }
    }

    // Initialize responsive handlers
    initializeResponsive() {
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize(); // Initial call
    }
}

// Initialize responsive behavior when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    const uiManager = new UIManager();
    uiManager.initializeResponsive?.();
});