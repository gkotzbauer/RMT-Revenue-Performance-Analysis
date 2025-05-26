// ============================================================================
// RMT Healthcare Revenue Analysis - Main Application Controller
// Advanced Statistical Methodology with Proper Train/Test Split
// ============================================================================

import { HealthcareAnalyzer } from './analyzer.js';
import { UIManager } from './ui-manager.js';
import { ChartManager } from './charts.js';
import { ExportManager } from './export.js';
import { formatCurrency, formatPercentage } from './utils.js';

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

    // ... rest of the class implementation ...

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
                const avgPaymentPerVisit = parseFloat(week['Actual Total Payments']) / parseFloat(week['Visit Count']);
                
                row.innerHTML = `
                    <td>${week.Year}</td>
                    <td>${week.Week}</td>
                    <td>${formatCurrency(avgPaymentPerVisit)}</td>
                    <td>${formatCurrency(parseFloat(week['Actual Total Payments']))}</td>
                    <td>${formatCurrency(parseFloat(week['Predicted Total Payments']))}</td>
                    <td>${formatCurrency(parseFloat(week['Absolute Error']))}</td>
                    <td><span class="performance-indicator ${performanceClass}">${week['Performance Diagnostic']}</span></td>
                    <td>${week['Most Influential Performance Factors']}</td>
                `;
                
                dataTableBody.appendChild(row);
            });
        }
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
