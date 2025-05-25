// ============================================================================
// Export Manager - Healthcare Revenue Analysis Data Export
// Handles CSV and PDF export functionality
// ============================================================================

export class ExportManager {
    constructor() {
        this.exportFormats = {
            csv: this.exportCSV.bind(this),
            pdf: this.exportPDF.bind(this),
            json: this.exportJSON.bind(this)
        };
    }

    init() {
        console.log('📋 Initializing Export Manager...');
        console.log('✅ Export Manager initialized');
    }

    async exportResults(results, format) {
        console.log(`📤 Exporting results as ${format.toUpperCase()}...`);
        
        if (!results || !results.finalResults) {
            throw new Error('No results available for export');
        }

        const exportFunction = this.exportFormats[format.toLowerCase()];
        if (!exportFunction) {
            throw new Error(`Unsupported export format: ${format}`);
        }

        try {
            await exportFunction(results);
            console.log(`✅ ${format.toUpperCase()} export completed successfully`);
        } catch (error) {
            console.error(`❌ ${format.toUpperCase()} export failed:`, error);
            throw error;
        }
    }

    async exportCSV(results) {
        console.log('📊 Generating CSV export...');
        
        const data = results.finalResults;
        const headers = Object.keys(data[0]);
        
        // Create CSV content
        let csvContent = headers.join(',') + '\n';
        
        data.forEach(row => {
            const values = headers.map(header => {
                let value = row[header];
                
                // Handle values that contain commas or quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                    value = '"' + value.replace(/"/g, '""') + '"';
                }
                
                return value;
            });
            
            csvContent += values.join(',') + '\n';
        });

        // Add metadata at the top
        const metadata = this.generateMetadata(results);
        const fullCSV = metadata + '\n' + csvContent;

        // Download the file
        this.downloadFile(fullCSV, 'healthcare-revenue-analysis.csv', 'text/csv');
    }

    async exportJSON(results) {
        console.log('📋 Generating JSON export...');
        
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                methodology: results.methodology,
                bestModel: results.bestModel.modelName,
                accuracy: results.benchmarks.avgAccuracy,
                totalWeeks: results.benchmarks.totalWeeks,
                modelMAE: results.benchmarks.modelMAE
            },
            correlations: results.trainCorrelations,
            performanceDistribution: this.calculatePerformanceDistribution(results.performanceResults),
            detailedResults: results.finalResults,
            summary: this.generateSummaryStats(results)
        };

        const jsonContent = JSON.stringify(exportData, null, 2);
        this.downloadFile(jsonContent, 'healthcare-revenue-analysis.json', 'application/json');
    }

    async exportPDF(results) {
        console.log('📄 Generating PDF report...');
        
        // Since we don't have a PDF library loaded, we'll create an HTML report
        // that can be printed as PDF
        const htmlReport = this.generateHTMLReport(results);
        
        // Open in new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(htmlReport);
        printWindow.document.close();
        
        // Focus and print
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }

    generateHTMLReport(results) {
        const performanceDistribution = this.calculatePerformanceDistribution(results.performanceResults);
        const summaryStats = this.generateSummaryStats(results);
        
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Healthcare Revenue Analysis Report</title>
            <style>
                body { 
                    font-family: 'Arial', sans-serif; 
                    margin: 40px; 
                    line-height: 1.6; 
                    color: #333;
                }
                .header { 
                    text-align: center; 
                    border-bottom: 3px solid #2563eb; 
                    padding-bottom: 20px; 
                    margin-bottom: 30px;
                }
                .metric-grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                    gap: 20px; 
                    margin: 20px 0;
                }
                .metric-card { 
                    border: 1px solid #e5e7eb; 
                    padding: 15px; 
                    border-radius: 8px; 
                    text-align: center;
                    background: #f9fafb;
                }
                .metric-value { 
                    font-size: 2em; 
                    font-weight: bold; 
                    color: #2563eb; 
                    margin-bottom: 5px;
                }
                .metric-label { 
                    font-size: 0.9em; 
                    color: #6b7280; 
                    text-transform: uppercase;
                }
                .section { 
                    margin: 30px 0; 
                    page-break-inside: avoid;
                }
                .section h2 { 
                    color: #2563eb; 
                    border-bottom: 2px solid #e5e7eb; 
                    padding-bottom: 10px;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 15px 0;
                }
                th, td { 
                    border: 1px solid #e5e7eb; 
                    padding: 8px; 
                    text-align: left; 
                    font-size: 0.9em;
                }
                th { 
                    background: #f3f4f6; 
                    font-weight: bold;
                }
                .performance-over { color: #059669; font-weight: bold; }
                .performance-under { color: #dc2626; font-weight: bold; }
                .performance-average { color: #d97706; font-weight: bold; }
                .footer { 
                    margin-top: 40px; 
                    text-align: center; 
                    font-size: 0.8em; 
                    color: #6b7280; 
                    border-top: 1px solid #e5e7eb; 
                    padding-top: 20px;
                }
                @media print {
                    body { margin: 20px; }
                    .metric-grid { grid-template-columns: repeat(2, 1fr); }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📊 RMT Healthcare Revenue Analysis Report</h1>
                <p><strong>Generated:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                <p><strong>Analysis Period:</strong> ${results.finalResults.length} weeks of data</p>
            </div>

            <div class="section">
                <h2>🎯 Executive Summary</h2>
                <div class="metric-grid">
                    <div class="metric-card">
                        <div class="metric-value">${results.bestModel.modelName}</div>
                        <div class="metric-label">Best Performing Model</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${results.benchmarks.avgAccuracy}</div>
                        <div class="metric-label">Model Accuracy</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">$${Math.round(results.benchmarks.modelMAE).toLocaleString()}</div>
                        <div class="metric-label">Mean Absolute Error</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${results.benchmarks.totalWeeks}</div>
                        <div class="metric-label">Weeks Analyzed</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>📈 Performance Distribution</h2>
                <div class="metric-grid">
                    <div class="metric-card">
                        <div class="metric-value performance-over">${performanceDistribution.overPerformed}</div>
                        <div class="metric-label">Over Performed (${performanceDistribution.overPerformedPct}%)</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value performance-average">${performanceDistribution.averagePerformed}</div>
                        <div class="metric-label">Average Performance (${performanceDistribution.averagePerformedPct}%)</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value performance-under">${performanceDistribution.underPerformed}</div>
                        <div class="metric-label">Under Performed (${performanceDistribution.underPerformedPct}%)</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>🔗 Key Performance Correlations</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Performance Factor</th>
                            <th>Correlation</th>
                            <th>Strength</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(results.trainCorrelations || {}).map(([factor, correlation]) => `
                            <tr>
                                <td>${this.formatFeatureName(factor)}</td>
                                <td>${correlation.toFixed(3)}</td>
                                <td>${this.getCorrelationStrength(correlation)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="section">
                <h2>📊 Revenue Performance Summary</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Metric</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>Total Revenue (Actual)</td><td>$${summaryStats.totalActualRevenue.toLocaleString()}</td></tr>
                        <tr><td>Total Revenue (Predicted)</td><td>$${summaryStats.totalPredictedRevenue.toLocaleString()}</td></tr>
                        <tr><td>Average Weekly Revenue</td><td>$${summaryStats.avgWeeklyRevenue.toLocaleString()}</td></tr>
                        <tr><td>Revenue Range</td><td>$${summaryStats.minRevenue.toLocaleString()} - $${summaryStats.maxRevenue.toLocaleString()}</td></tr>
                        <tr><td>Standard Deviation</td><td>$${summaryStats.revenueStdDev.toLocaleString()}</td></tr>
                    </tbody>
                </table>
            </div>

            <div class="section">
                <h2>📋 Detailed Weekly Results (Top 10)</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Week</th>
                            <th>Actual Revenue</th>
                            <th>Predicted Revenue</th>
                            <th>Error</th>
                            <th>Performance</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.finalResults.slice(0, 10).map(week => `
                            <tr>
                                <td>${week.Year}-${week.Week}</td>
                                <td>$${parseFloat(week['Actual Total Payments']).toLocaleString()}</td>
                                <td>$${parseFloat(week['Predicted Total Payments']).toLocaleString()}</td>
                                <td>$${parseFloat(week['Absolute Error']).toLocaleString()}</td>
                                <td class="performance-${week['Performance Diagnostic'].toLowerCase().replace(/\s+/g, '-')}">${week['Performance Diagnostic']}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="section">
                <h2>🔬 Methodology</h2>
                <p><strong>Statistical Approach:</strong> ${results.methodology}</p>
                <ul>
                    <li><strong>Train/Test Split:</strong> 80/20 chronological split to prevent data leakage</li>
                    <li><strong>Model Validation:</strong> Multiple algorithms compared using MAE, RMSE, MAPE, R-squared</li>
                    <li><strong>Performance Classification:</strong> ±2.5% threshold for over/under performance</li>
                    <li><strong>Correlation Analysis:</strong> Performed only on training data to ensure validity</li>
                </ul>
            </div>

            <div class="footer">
                <p>📊 RMT Healthcare Revenue Performance Analysis Tool</p>
                <p>Advanced Statistical Methodology • Professional Healthcare Analytics</p>
                <p>Report generated on ${new Date().toLocaleDateString()} • For internal use only</p>
            </div>
        </body>
        </html>
        `;
    }

    calculatePerformanceDistribution(performanceResults) {
        const distribution = performanceResults.reduce((acc, result) => {
            acc[result.performanceDiagnostic] = (acc[result.performanceDiagnostic] || 0) + 1;
            return acc;
        }, {});

        const total = performanceResults.length;
        
        return {
            overPerformed: distribution['Over Performed'] || 0,
            averagePerformed: distribution['Average Performance'] || 0,
            underPerformed: distribution['Under Performed'] || 0,
            overPerformedPct: ((distribution['Over Performed'] || 0) / total * 100).toFixed(1),
            averagePerformedPct: ((distribution['Average Performance'] || 0) / total * 100).toFixed(1),
            underPerformedPct: ((distribution['Under Performed'] || 0) / total * 100).toFixed(1)
        };
    }

    generateSummaryStats(results) {
        const actualRevenues = results.finalResults.map(week => parseFloat(week['Actual Total Payments']));
        const predictedRevenues = results.finalResults.map(week => parseFloat(week['Predicted Total Payments']));
        
        const totalActualRevenue = actualRevenues.reduce((sum, val) => sum + val, 0);
        const totalPredictedRevenue = predictedRevenues.reduce((sum, val) => sum + val, 0);
        const avgWeeklyRevenue = totalActualRevenue / actualRevenues.length;
        const minRevenue = Math.min(...actualRevenues);
        const maxRevenue = Math.max(...actualRevenues);
        
        // Calculate standard deviation
        const mean = avgWeeklyRevenue;
        const squaredDiffs = actualRevenues.map(val => Math.pow(val - mean, 2));
        const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / squaredDiffs.length;
        const revenueStdDev = Math.sqrt(avgSquaredDiff);
        
        return {
            totalActualRevenue: Math.round(totalActualRevenue),
            totalPredictedRevenue: Math.round(totalPredictedRevenue),
            avgWeeklyRevenue: Math.round(avgWeeklyRevenue),
            minRevenue: Math.round(minRevenue),
            maxRevenue: Math.round(maxRevenue),
            revenueStdDev: Math.round(revenueStdDev)
        };
    }

    generateMetadata(results) {
        return `# RMT Healthcare Revenue Performance Analysis
# Generated: ${new Date().toISOString()}
# Methodology: ${results.methodology}
# Best Model: ${results.bestModel.modelName}
# Accuracy: ${results.benchmarks.avgAccuracy}
# Total Weeks: ${results.benchmarks.totalWeeks}
# Mean Absolute Error: $${Math.round(results.benchmarks.modelMAE)}
#
# Statistical Validation:
# - Train/Test Split: 80/20 chronological
# - No data leakage in correlation analysis
# - Multiple model comparison with rigorous metrics
# - Performance classification with ±2.5% threshold
#`;
    }

    formatFeatureName(feature) {
        const nameMap = {
            'totalChargeAmount': 'Total Charges',
            'totalVisitCount': 'Visit Count',
            'weightedAvgCollectionPct': 'Collection Rate',
            'avgPaymentPerVisit': 'Payment per Visit',
            'bcbsChargesPct': 'BCBS Percentage',
            'aetnaChargesPct': 'Aetna Percentage'
        };
        return nameMap[feature] || feature;
    }

    getCorrelationStrength(correlation) {
        const abs = Math.abs(correlation);
        if (abs > 0.8) return 'Very Strong';
        if (abs > 0.6) return 'Strong';
        if (abs > 0.4) return 'Moderate';
        if (abs > 0.2) return 'Weak';
        return 'Very Weak';
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up the URL object
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
        }, 100);
    }

    // Server-side export (if API is available)
    async exportViaAPI(results, format) {
        try {
            const response = await fetch('/api/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    format: format,
                    data: results
                })
            });

            if (!response.ok) {
                throw new Error(`Export API failed: ${response.statusText}`);
            }

            // Handle file download from server response
            const contentDisposition = response.headers.get('content-disposition');
            const filename = contentDisposition ? 
                contentDisposition.split('filename=')[1].replace(/"/g, '') :
                `healthcare-analysis.${format}`;

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            
            window.URL.revokeObjectURL(url);
            
        } catch (error) {
            console.warn('Server export failed, falling back to client-side export:', error);
            // Fallback to client-side export
            await this.exportResults(results, format);
        }
    }
}
