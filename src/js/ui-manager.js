// UI Manager - Handles all user interface interactions and state management

export class UIManager {
    constructor() {
        this.currentSection = 'upload';
        this.notifications = [];
    }

    hideAllSections() {
        const sections = ['upload-section', 'loading-section', 'results-section'];
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.classList.add('hidden');
                section.classList.remove('fade-in', 'slide-up');
            }
        });
    }

    showSection(sectionId) {
        this.hideAllSections();
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.remove('hidden');
            section.classList.add('fade-in');
            this.currentSection = sectionId.replace('-section', '');
        }
    }

    showNotification(message, type = 'info', duration = 5000) {
        const notification = this.createNotification(message, type);
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Auto-remove
        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);
        
        // Store reference
        this.notifications.push(notification);
    }

    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = this.getNotificationIcon(type);
        
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icon}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;
        
        // Add styles if not already added
        this.ensureNotificationStyles();
        
        return notification;
    }

    getNotificationIcon(type) {
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    ensureNotificationStyles() {
        if (document.getElementById('notification-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                max-width: 400px;
                padding: 1rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 1000;
                transform: translateX(100%);
                transition: transform 0.3s ease, opacity 0.3s ease;
                opacity: 0;
                margin-bottom: 10px;
            }
            
            .notification.show {
                transform: translateX(0);
                opacity: 1;
            }
            
            .notification.success {
                background: #d1fae5;
                border-left: 4px solid #059669;
                color: #065f46;
            }
            
            .notification.error {
                background: #fee2e2;
                border-left: 4px solid #dc2626;
                color: #991b1b;
            }
            
            .notification.warning {
                background: #fef3c7;
                border-left: 4px solid #d97706;
                color: #92400e;
            }
            
            .notification.info {
                background: #dbeafe;
                border-left: 4px solid #2563eb;
                color: #1e40af;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            
            .notification-icon {
                font-size: 1.25rem;
                flex-shrink: 0;
            }
            
            .notification-message {
                flex: 1;
                line-height: 1.5;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 1.25rem;
                cursor: pointer;
                opacity: 0.7;
                transition: opacity 0.2s ease;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .notification-close:hover {
                opacity: 1;
            }
            
            @media (max-width: 768px) {
                .notification {
                    right: 10px;
                    left: 10px;
                    max-width: none;
                    transform: translateY(-100%);
                }
                
                .notification.show {
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(styles);
    }

    removeNotification(notification) {
        if (notification && notification.parentElement) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
            
            // Remove from tracking array
            this.notifications = this.notifications.filter(n => n !== notification);
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showWarning(message) {
        this.showNotification(message, 'warning');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    updateProgress(percentage, status = '') {
        const progressFill = document.getElementById('progress-fill');
        const loadingStatus = document.getElementById('loading-status');
        
        if (progressFill) {
            progressFill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        }
        
        if (loadingStatus && status) {
            loadingStatus.textContent = status;
        }
    }

    setLoadingState(isLoading, message = '') {
        const loadingSection = document.getElementById('loading-section');
        const loadingStatus = document.getElementById('loading-status');
        
        if (isLoading) {
            this.showSection('loading-section');
            if (message && loadingStatus) {
                loadingStatus.textContent = message;
            }
        } else {
            loadingSection?.classList.add('hidden');
        }
    }

    populateTable(data, tableId = 'results-table') {
        const table = document.getElementById(tableId);
        if (!table || !data || data.length === 0) return;
        
        const tbody = table.querySelector('tbody');
        if (!tbody) return;
        
        // Clear existing data
        tbody.innerHTML = '';
        
        // Add rows
        data.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = this.createTableRow(row, index);
            tbody.appendChild(tr);
        });
    }

    createTableRow(rowData, index) {
        // This method should be customized based on your data structure
        const performance = rowData['Performance Diagnostic'] || '';
        const performanceClass = performance.toLowerCase().replace(/\s+/g, '-');
        
        return `
            <td>${rowData.Year || ''}</td>
            <td>${rowData.Week || ''}</td>
            <td>$${this.formatNumber(parseFloat(rowData['Actual Total Payments'] || 0))}</td>
            <td>$${this.formatNumber(parseFloat(rowData['Predicted Total Payments'] || 0))}</td>
            <td>${rowData['Percent Error'] || ''}</td>
            <td>
                <span class="performance-badge performance-${performanceClass}">
                    ${performance}
                </span>
            </td>
            <td class="text-small">${this.truncateText(rowData['What Went Well'] || '', 100)}</td>
            <td class="text-small">${this.truncateText(rowData['What Could Be Improved'] || '', 100)}</td>
            <td class="text-small">${this.truncateText(rowData['BCBS Analysis'] || '', 80)}</td>
            <td class="text-small">${this.truncateText(rowData['Aetna Analysis'] || '', 80)}</td>
        `;
    }

    formatNumber(num) {
        if (isNaN(num)) return '0';
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(num);
    }

    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    addTableSearch(inputId, tableId) {
        const searchInput = document.getElementById(inputId);
        const table = document.getElementById(tableId);
        
        if (!searchInput || !table) return;
        
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const rows = table.querySelectorAll('tbody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
            
            // Update visible count
            const visibleRows = Array.from(rows).filter(row => row.style.display !== 'none');
            this.updateSearchResults(visibleRows.length, rows.length);
        });
    }

    updateSearchResults(visible, total) {
        let resultsInfo = document.getElementById('search-results-info');
        if (!resultsInfo) {
            resultsInfo = document.createElement('div');
            resultsInfo.id = 'search-results-info';
            resultsInfo.className = 'search-results-info';
            
            const searchInput = document.getElementById('search-input');
            if (searchInput && searchInput.parentElement) {
                searchInput.parentElement.appendChild(resultsInfo);
            }
        }
        
        if (visible === total) {
            resultsInfo.textContent = '';
        } else {
            resultsInfo.textContent = `Showing ${visible} of ${total} results`;
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = ''; // Restore scrolling
        }
    }

    setupModalEvents(modalId, closeButtonId, closeOnBackdrop = true) {
        const modal = document.getElementById(modalId);
        const closeButton = document.getElementById(closeButtonId);
        
        if (closeButton) {
            closeButton.addEventListener('click', () => this.hideModal(modalId));
        }
        
        if (closeOnBackdrop && modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modalId);
                }
            });
        }
        
        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal(modalId);
            }
        });
    }

    animateValue(elementId, start, end, duration = 1000) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const startTime = performance.now();
        const isNumber = !isNaN(end);
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOut = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
            
            if (isNumber) {
                const current = start + (end - start) * easeOut;
                element.textContent = Math.round(current).toLocaleString();
            } else {
                // For non-numeric values, just set at the end
                if (progress === 1) {
                    element.textContent = end;
                }
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    createLoadingState(text = 'Loading...') {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-state';
        loadingDiv.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">${text}</div>
        `;
        return loadingDiv;
    }

    addTableSorting(tableId) {
        const table = document.getElementById(tableId);
        if (!table) return;
        
        const headers = table.querySelectorAll('th');
        headers.forEach((header, index) => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => {
                this.sortTable(table, index);
            });
        });
    }

    sortTable(table, columnIndex) {
        const tbody = table.querySelector('tbody');
        if (!tbody) return;
        
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const isNumeric = this.isNumericColumn(rows, columnIndex);
        
        // Determine sort direction
        const currentSort = table.getAttribute('data-sort-column');
        const currentDirection = table.getAttribute('data-sort-direction');
        const isAscending = currentSort != columnIndex || currentDirection === 'desc';
        
        rows.sort((a, b) => {
            const aValue = this.getCellValue(a, columnIndex);
            const bValue = this.getCellValue(b, columnIndex);
            
            let comparison;
            if (isNumeric) {
                comparison = parseFloat(aValue || 0) - parseFloat(bValue || 0);
            } else {
                comparison = aValue.localeCompare(bValue);
            }
            
            return isAscending ? comparison : -comparison;
        });
        
        // Update table
        rows.forEach(row => tbody.appendChild(row));
        
        // Update sort indicators
        table.setAttribute('data-sort-column', columnIndex);
        table.setAttribute('data-sort-direction', isAscending ? 'asc' : 'desc');
        
        // Update header indicators
        const headers = table.querySelectorAll('th');
        headers.forEach((header, index) => {
            header.classList.remove('sort-asc', 'sort-desc');
            if (index === columnIndex) {
                header.classList.add(isAscending ? 'sort-asc' : 'sort-desc');
            }
        });
    }

    getCellValue(row, columnIndex) {
        const cell = row.cells[columnIndex];
        return cell ? cell.textContent.trim() : '';
    }

    isNumericColumn(rows, columnIndex) {
        if (rows.length === 0) return false;
        
        const sampleValues = rows.slice(0, 5).map(row => {
            const value = this.getCellValue(row, columnIndex);
            return value.replace(/[$,\s%]/g, ''); // Remove currency and percentage symbols
        });
        
        return sampleValues.every(value => !isNaN(parseFloat(value)));
    }

    clearNotifications() {
        this.notifications.forEach(notification => {
            this.removeNotification(notification);
        });
        this.notifications = [];
    }
}
