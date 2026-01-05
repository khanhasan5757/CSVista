// Global State Management
const appState = {
  rawData: [],
  filteredData: [],
  displayData: [],
  columns: [],
  filters: [],
  sortColumn: null,
  sortDirection: 'asc',
  currentPage: 1,
  rowsPerPage: 25,
  searchTerm: '',
  selectedRows: [],
  currentChart: null,
  annotations: {}
};

// Utility Functions
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: '✓',
    error: '✗',
    info: 'ℹ'
  };
  
  toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span class="toast-message">${message}</span>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function parseCSV(text) {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return { headers: [], data: [] };
  
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }
  
  return { headers, data };
}

function isNumeric(value) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

function getColumnType(columnName) {
  const sampleValues = appState.rawData.slice(0, 10).map(row => row[columnName]);
  const numericCount = sampleValues.filter(v => isNumeric(v)).length;
  return numericCount > 5 ? 'numeric' : 'text';
}

function calculateStats(column) {
  const values = appState.rawData.map(row => row[column]).filter(v => v !== '' && v !== null);
  const type = getColumnType(column);
  
  if (type === 'numeric') {
    const numbers = values.map(v => parseFloat(v));
    const sorted = [...numbers].sort((a, b) => a - b);
    const sum = numbers.reduce((a, b) => a + b, 0);
    const mean = sum / numbers.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    
    // Calculate standard deviation
    const variance = numbers.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numbers.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      type: 'numeric',
      count: numbers.length,
      mean: mean.toFixed(2),
      median: median.toFixed(2),
      min: min.toFixed(2),
      max: max.toFixed(2),
      stdDev: stdDev.toFixed(2),
      missing: appState.rawData.length - numbers.length
    };
  } else {
    const unique = [...new Set(values)];
    const frequency = {};
    values.forEach(v => frequency[v] = (frequency[v] || 0) + 1);
    const mostCommon = Object.entries(frequency).sort((a, b) => b[1] - a[1])[0];
    
    return {
      type: 'text',
      count: values.length,
      unique: unique.length,
      mostCommon: mostCommon ? `${mostCommon[0]} (${mostCommon[1]} times)` : 'N/A',
      missing: appState.rawData.length - values.length
    };
  }
}

function detectOutliers(column) {
  if (getColumnType(column) !== 'numeric') return [];
  
  const values = appState.rawData
    .map((row, idx) => ({ value: parseFloat(row[column]), index: idx }))
    .filter(item => !isNaN(item.value));
  
  const sorted = values.map(v => v.value).sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  return values.filter(item => item.value < lowerBound || item.value > upperBound);
}

function calculateCorrelation(col1, col2) {
  const data1 = appState.rawData.map(row => parseFloat(row[col1])).filter(v => !isNaN(v));
  const data2 = appState.rawData.map(row => parseFloat(row[col2])).filter(v => !isNaN(v));
  
  const n = Math.min(data1.length, data2.length);
  if (n === 0) return 0;
  
  const mean1 = data1.reduce((a, b) => a + b, 0) / n;
  const mean2 = data2.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denom1 = 0;
  let denom2 = 0;
  
  for (let i = 0; i < n; i++) {
    const diff1 = data1[i] - mean1;
    const diff2 = data2[i] - mean2;
    numerator += diff1 * diff2;
    denom1 += diff1 * diff1;
    denom2 += diff2 * diff2;
  }
  
  if (denom1 === 0 || denom2 === 0) return 0;
  return numerator / Math.sqrt(denom1 * denom2);
}

// Navigation
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.content-section');
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      if (item.disabled) return;
      
      const targetSection = item.dataset.section;
      
      navItems.forEach(nav => nav.classList.remove('active'));
      sections.forEach(section => section.classList.remove('active'));
      
      item.classList.add('active');
      document.getElementById(`${targetSection}-section`).classList.add('active');
    });
  });
}

function enableNavigation() {
  const navItems = document.querySelectorAll('.nav-item:not([data-section="upload"])');
  navItems.forEach(item => item.disabled = false);
}

// File Upload
function setupFileUpload() {
  const uploadZone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');
  const browseBtn = document.getElementById('browse-btn');
  const changeFileBtn = document.getElementById('change-file-btn');
  
  browseBtn.addEventListener('click', () => fileInput.click());
  
  changeFileBtn.addEventListener('click', () => {
    fileInput.value = '';
    document.getElementById('file-preview').style.display = 'none';
    uploadZone.style.display = 'block';
  });
  
  uploadZone.addEventListener('click', (e) => {
    if (e.target === uploadZone || e.target.closest('.upload-zone')) {
      fileInput.click();
    }
  });
  
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
  });
  
  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('drag-over');
  });
  
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  });
  
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });
}

function handleFile(file) {
  if (!file.name.endsWith('.csv')) {
    showToast('Please upload a CSV file', 'error');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    const { headers, data } = parseCSV(text);
    
    if (data.length === 0) {
      showToast('CSV file is empty', 'error');
      return;
    }
    
    appState.rawData = data;
    appState.filteredData = [...data];
    appState.columns = headers;
    
    // Show file preview
    document.getElementById('preview-filename').textContent = file.name;
    document.getElementById('preview-size').textContent = `${(file.size / 1024).toFixed(2)} KB`;
    document.getElementById('preview-rows').textContent = data.length;
    document.getElementById('preview-columns').textContent = headers.length;
    document.getElementById('file-preview').style.display = 'block';
    document.getElementById('upload-zone').style.display = 'none';
    
    showToast('File uploaded successfully!', 'success');
    enableNavigation();
    initializeApp();
  };
  
  reader.readAsText(file);
}

// Initialize App
function initializeApp() {
  renderStatistics();
  setupStatisticsPanel();
  renderDataTable();
  setupTableControls();
  setupVisualization();
  generateInsights();
  setupTransformations();
  setupExport();
}

// Statistics
function renderStatistics() {
  const statsGrid = document.getElementById('stats-grid');
  const numericColumns = appState.columns.filter(col => getColumnType(col) === 'numeric');
  
  const stats = [
    {
      title: 'Total Rows',
      value: appState.rawData.length,
      icon: '📊',
      color: 'var(--color-bg-1)'
    },
    {
      title: 'Total Columns',
      value: appState.columns.length,
      icon: '📋',
      color: 'var(--color-bg-2)'
    },
    {
      title: 'Numeric Columns',
      value: numericColumns.length,
      icon: '🔢',
      color: 'var(--color-bg-3)'
    },
    {
      title: 'Missing Values',
      value: countMissingValues(),
      icon: '❓',
      color: 'var(--color-bg-4)'
    }
  ];
  
  statsGrid.innerHTML = stats.map(stat => `
    <div class="stat-card" style="border-left: 4px solid ${stat.color}">
      <div class="stat-card-header">
        <span class="stat-card-title">${stat.title}</span>
        <span class="stat-card-icon">${stat.icon}</span>
      </div>
      <div class="stat-card-value">${stat.value}</div>
    </div>
  `).join('');
}

function countMissingValues() {
  let count = 0;
  appState.rawData.forEach(row => {
    appState.columns.forEach(col => {
      if (!row[col] || row[col] === '') count++;
    });
  });
  return count;
}

function setupStatisticsPanel() {
  const select = document.getElementById('stats-column-select');
  select.innerHTML = '<option value="">Choose a column...</option>' +
    appState.columns.map(col => `<option value="${col}">${col}</option>`).join('');
  
  select.addEventListener('change', (e) => {
    const column = e.target.value;
    if (!column) {
      document.getElementById('column-stats-details').innerHTML = '';
      return;
    }
    
    const stats = calculateStats(column);
    const detailsDiv = document.getElementById('column-stats-details');
    
    if (stats.type === 'numeric') {
      detailsDiv.innerHTML = `
        <div class="stats-item"><span class="stats-item-label">Count:</span><span class="stats-item-value">${stats.count}</span></div>
        <div class="stats-item"><span class="stats-item-label">Mean:</span><span class="stats-item-value">${stats.mean}</span></div>
        <div class="stats-item"><span class="stats-item-label">Median:</span><span class="stats-item-value">${stats.median}</span></div>
        <div class="stats-item"><span class="stats-item-label">Std Dev:</span><span class="stats-item-value">${stats.stdDev}</span></div>
        <div class="stats-item"><span class="stats-item-label">Min:</span><span class="stats-item-value">${stats.min}</span></div>
        <div class="stats-item"><span class="stats-item-label">Max:</span><span class="stats-item-value">${stats.max}</span></div>
        <div class="stats-item"><span class="stats-item-label">Missing:</span><span class="stats-item-value">${stats.missing}</span></div>
      `;
    } else {
      detailsDiv.innerHTML = `
        <div class="stats-item"><span class="stats-item-label">Count:</span><span class="stats-item-value">${stats.count}</span></div>
        <div class="stats-item"><span class="stats-item-label">Unique Values:</span><span class="stats-item-value">${stats.unique}</span></div>
        <div class="stats-item"><span class="stats-item-label">Most Common:</span><span class="stats-item-value">${stats.mostCommon}</span></div>
        <div class="stats-item"><span class="stats-item-label">Missing:</span><span class="stats-item-value">${stats.missing}</span></div>
      `;
    }
  });
}

// Data Table
function renderDataTable() {
  applyFilters();
  applySorting();
  applyPagination();
  
  const thead = document.getElementById('table-header');
  const tbody = document.getElementById('table-body');
  
  // Render header
  thead.innerHTML = `
    <tr>
      ${appState.columns.map(col => `
        <th data-column="${col}">
          ${col}
          <span class="sort-indicator">${appState.sortColumn === col ? (appState.sortDirection === 'asc' ? '▲' : '▼') : ''}</span>
        </th>
      `).join('')}
      <th>Annotation</th>
    </tr>
  `;
  
  // Add click handlers for sorting
  thead.querySelectorAll('th[data-column]').forEach(th => {
    th.addEventListener('click', () => {
      const column = th.dataset.column;
      if (appState.sortColumn === column) {
        appState.sortDirection = appState.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        appState.sortColumn = column;
        appState.sortDirection = 'asc';
      }
      renderDataTable();
    });
  });
  
  // Render body
  if (appState.displayData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="100%" class="text-center">No data to display</td></tr>';
    return;
  }
  
  tbody.innerHTML = appState.displayData.map((row, idx) => {
    const globalIdx = appState.filteredData.indexOf(row);
    return `
      <tr>
        ${appState.columns.map(col => `<td>${row[col] || ''}</td>`).join('')}
        <td>
          <input type="text" 
            class="form-control" 
            placeholder="Add note..." 
            value="${appState.annotations[globalIdx] || ''}"
            data-row="${globalIdx}"
            style="font-size: 12px; padding: 4px 8px;">
        </td>
      </tr>
    `;
  }).join('');
  
  // Add annotation handlers
  tbody.querySelectorAll('input[data-row]').forEach(input => {
    input.addEventListener('change', (e) => {
      const rowIdx = parseInt(e.target.dataset.row);
      appState.annotations[rowIdx] = e.target.value;
      showToast('Annotation saved', 'success');
    });
  });
  
  updatePaginationInfo();
}

function applyFilters() {
  let data = [...appState.rawData];
  
  // Apply search filter
  if (appState.searchTerm) {
    const term = appState.searchTerm.toLowerCase();
    data = data.filter(row => {
      return appState.columns.some(col => 
        String(row[col]).toLowerCase().includes(term)
      );
    });
  }
  
  // Apply custom filters
  appState.filters.forEach(filter => {
    data = data.filter(row => {
      const value = String(row[filter.column]).toLowerCase();
      const filterValue = filter.value.toLowerCase();
      
      switch (filter.operator) {
        case 'equals': return value === filterValue;
        case 'contains': return value.includes(filterValue);
        case 'starts': return value.startsWith(filterValue);
        case 'ends': return value.endsWith(filterValue);
        case 'gt': return parseFloat(value) > parseFloat(filterValue);
        case 'lt': return parseFloat(value) < parseFloat(filterValue);
        case 'gte': return parseFloat(value) >= parseFloat(filterValue);
        case 'lte': return parseFloat(value) <= parseFloat(filterValue);
        default: return true;
      }
    });
  });
  
  appState.filteredData = data;
}

function applySorting() {
  if (!appState.sortColumn) return;
  
  appState.filteredData.sort((a, b) => {
    const aVal = a[appState.sortColumn];
    const bVal = b[appState.sortColumn];
    
    if (isNumeric(aVal) && isNumeric(bVal)) {
      return appState.sortDirection === 'asc' 
        ? parseFloat(aVal) - parseFloat(bVal)
        : parseFloat(bVal) - parseFloat(aVal);
    }
    
    const comparison = String(aVal).localeCompare(String(bVal));
    return appState.sortDirection === 'asc' ? comparison : -comparison;
  });
}

function applyPagination() {
  const start = (appState.currentPage - 1) * appState.rowsPerPage;
  const end = start + appState.rowsPerPage;
  appState.displayData = appState.filteredData.slice(start, end);
}

function updatePaginationInfo() {
  const totalPages = Math.ceil(appState.filteredData.length / appState.rowsPerPage);
  const pageInfo = document.getElementById('page-info');
  pageInfo.textContent = `Page ${appState.currentPage} of ${totalPages || 1} (${appState.filteredData.length} rows)`;
  
  document.getElementById('prev-page').disabled = appState.currentPage === 1;
  document.getElementById('next-page').disabled = appState.currentPage >= totalPages;
}

function setupTableControls() {
  // Search
  const searchInput = document.getElementById('table-search');
  searchInput.addEventListener('input', (e) => {
    appState.searchTerm = e.target.value;
    appState.currentPage = 1;
    renderDataTable();
  });
  
  // Rows per page
  document.getElementById('rows-per-page').addEventListener('change', (e) => {
    appState.rowsPerPage = parseInt(e.target.value);
    appState.currentPage = 1;
    renderDataTable();
  });
  
  // Pagination
  document.getElementById('prev-page').addEventListener('click', () => {
    if (appState.currentPage > 1) {
      appState.currentPage--;
      renderDataTable();
    }
  });
  
  document.getElementById('next-page').addEventListener('click', () => {
    const totalPages = Math.ceil(appState.filteredData.length / appState.rowsPerPage);
    if (appState.currentPage < totalPages) {
      appState.currentPage++;
      renderDataTable();
    }
  });
  
  // Filter modal
  setupFilterModal();
}

function setupFilterModal() {
  const modal = document.getElementById('filter-modal');
  const addFilterBtn = document.getElementById('add-filter-btn');
  const closeModalBtn = document.getElementById('close-filter-modal');
  const cancelBtn = document.getElementById('cancel-filter-btn');
  const applyBtn = document.getElementById('apply-filter-btn');
  const clearFiltersBtn = document.getElementById('clear-filters-btn');
  
  const filterColumnSelect = document.getElementById('filter-column');
  filterColumnSelect.innerHTML = appState.columns.map(col => 
    `<option value="${col}">${col}</option>`
  ).join('');
  
  addFilterBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
  });
  
  closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  cancelBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  applyBtn.addEventListener('click', () => {
    const column = document.getElementById('filter-column').value;
    const operator = document.getElementById('filter-operator').value;
    const value = document.getElementById('filter-value').value;
    
    if (!value) {
      showToast('Please enter a filter value', 'error');
      return;
    }
    
    appState.filters.push({ column, operator, value });
    renderFilterChips();
    renderDataTable();
    modal.style.display = 'none';
    
    // Reset form
    document.getElementById('filter-value').value = '';
    showToast('Filter applied', 'success');
  });
  
  clearFiltersBtn.addEventListener('click', () => {
    appState.filters = [];
    appState.searchTerm = '';
    document.getElementById('table-search').value = '';
    renderFilterChips();
    renderDataTable();
    showToast('All filters cleared', 'success');
  });
}

function renderFilterChips() {
  const container = document.getElementById('filter-chips');
  container.innerHTML = appState.filters.map((filter, idx) => `
    <div class="filter-chip">
      <span>${filter.column} ${filter.operator} "${filter.value}"</span>
      <button class="filter-chip-remove" data-index="${idx}">×</button>
    </div>
  `).join('');
  
  container.querySelectorAll('.filter-chip-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index);
      appState.filters.splice(idx, 1);
      renderFilterChips();
      renderDataTable();
      showToast('Filter removed', 'success');
    });
  });
}

// Visualizations
function setupVisualization() {
  const xAxisSelect = document.getElementById('x-axis-select');
  const yAxisSelect = document.getElementById('y-axis-select');
  
  xAxisSelect.innerHTML = appState.columns.map(col => 
    `<option value="${col}">${col}</option>`
  ).join('');
  yAxisSelect.innerHTML = appState.columns.map(col => 
    `<option value="${col}">${col}</option>`
  ).join('');
  
  document.getElementById('generate-chart-btn').addEventListener('click', generateChart);
  document.getElementById('download-chart-btn').addEventListener('click', downloadChart);
  document.getElementById('show-correlation-btn').addEventListener('click', showCorrelationMatrix);
}

function generateChart() {
  const chartType = document.getElementById('chart-type').value;
  const xAxis = document.getElementById('x-axis-select').value;
  const yAxis = document.getElementById('y-axis-select').value;
  
  const canvas = document.getElementById('main-chart');
  const ctx = canvas.getContext('2d');
  
  if (appState.currentChart) {
    appState.currentChart.destroy();
  }
  
  const chartData = prepareChartData(xAxis, yAxis, chartType);
  
  appState.currentChart = new Chart(ctx, {
    type: chartType,
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          enabled: true
        }
      },
      scales: chartType !== 'pie' ? {
        x: {
          title: {
            display: true,
            text: xAxis
          }
        },
        y: {
          title: {
            display: true,
            text: yAxis
          }
        }
      } : {}
    }
  });
  
  showToast('Chart generated successfully', 'success');
}

function prepareChartData(xAxis, yAxis, chartType) {
  const colors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B'];
  
  if (chartType === 'scatter') {
    const data = appState.filteredData
      .filter(row => isNumeric(row[xAxis]) && isNumeric(row[yAxis]))
      .map(row => ({
        x: parseFloat(row[xAxis]),
        y: parseFloat(row[yAxis])
      }));
    
    return {
      datasets: [{
        label: `${xAxis} vs ${yAxis}`,
        data: data,
        backgroundColor: colors[0]
      }]
    };
  }
  
  // Group data by x-axis value
  const grouped = {};
  appState.filteredData.forEach(row => {
    const key = row[xAxis];
    if (!grouped[key]) grouped[key] = [];
    if (isNumeric(row[yAxis])) {
      grouped[key].push(parseFloat(row[yAxis]));
    }
  });
  
  const labels = Object.keys(grouped).slice(0, 20); // Limit to 20 categories
  const data = labels.map(label => {
    const values = grouped[label];
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  });
  
  if (chartType === 'pie') {
    return {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors
      }]
    };
  }
  
  return {
    labels: labels,
    datasets: [{
      label: yAxis,
      data: data,
      backgroundColor: colors[0],
      borderColor: colors[0],
      fill: chartType === 'area'
    }]
  };
}

function downloadChart() {
  if (!appState.currentChart) {
    showToast('Please generate a chart first', 'error');
    return;
  }
  
  const canvas = document.getElementById('main-chart');
  const url = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = 'chart.png';
  link.href = url;
  link.click();
  showToast('Chart downloaded', 'success');
}

function showCorrelationMatrix() {
  const numericColumns = appState.columns.filter(col => getColumnType(col) === 'numeric');
  
  if (numericColumns.length < 2) {
    showToast('Need at least 2 numeric columns for correlation', 'error');
    return;
  }
  
  const matrix = [];
  numericColumns.forEach(col1 => {
    const row = [];
    numericColumns.forEach(col2 => {
      row.push(calculateCorrelation(col1, col2));
    });
    matrix.push(row);
  });
  
  const container = document.getElementById('correlation-matrix');
  container.innerHTML = `
    <table class="correlation-table">
      <thead>
        <tr>
          <th></th>
          ${numericColumns.map(col => `<th>${col}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${matrix.map((row, i) => `
          <tr>
            <th>${numericColumns[i]}</th>
            ${row.map(val => {
              const color = val > 0.7 ? '#1FB8CD' : val < -0.7 ? '#DB4545' : 'transparent';
              return `<td class="correlation-cell" style="background-color: ${color}; color: ${color !== 'transparent' ? 'white' : 'inherit'}">${val.toFixed(2)}</td>`;
            }).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  showToast('Correlation matrix generated', 'success');
}

// Smart Insights
function generateInsights() {
  const insightsGrid = document.getElementById('insights-grid');
  const insights = [];
  
  // Detect outliers
  const numericColumns = appState.columns.filter(col => getColumnType(col) === 'numeric');
  let totalOutliers = 0;
  const outlierDetails = [];
  
  numericColumns.forEach(col => {
    const outliers = detectOutliers(col);
    if (outliers.length > 0) {
      totalOutliers += outliers.length;
      outlierDetails.push(`${col}: ${outliers.length} outliers`);
    }
  });
  
  if (totalOutliers > 0) {
    insights.push({
      icon: '⚠️',
      title: 'Outliers Detected',
      description: `Found ${totalOutliers} outlier values across numeric columns. ${outlierDetails.slice(0, 3).join(', ')}`
    });
  }
  
  // High correlations
  if (numericColumns.length >= 2) {
    const highCorr = [];
    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = i + 1; j < numericColumns.length; j++) {
        const corr = calculateCorrelation(numericColumns[i], numericColumns[j]);
        if (Math.abs(corr) > 0.7) {
          highCorr.push(`${numericColumns[i]} & ${numericColumns[j]} (${corr.toFixed(2)})`);
        }
      }
    }
    
    if (highCorr.length > 0) {
      insights.push({
        icon: '🔗',
        title: 'High Correlation Found',
        description: `Strong relationships detected: ${highCorr.slice(0, 2).join(', ')}`
      });
    }
  }
  
  // Missing data pattern
  const missingCount = countMissingValues();
  const totalCells = appState.rawData.length * appState.columns.length;
  const missingPercent = ((missingCount / totalCells) * 100).toFixed(1);
  
  if (missingCount > 0) {
    insights.push({
      icon: '🕳️',
      title: 'Missing Data Pattern',
      description: `${missingCount} missing values (${missingPercent}% of total data). Consider data cleaning or imputation.`
    });
  }
  
  // Data quality score
  const qualityScore = 100 - parseFloat(missingPercent);
  insights.push({
    icon: qualityScore > 90 ? '✨' : qualityScore > 70 ? '👍' : '⚡',
    title: 'Data Quality Score',
    description: `Overall data completeness: ${qualityScore.toFixed(1)}%. ${qualityScore > 90 ? 'Excellent!' : qualityScore > 70 ? 'Good' : 'Needs improvement'}`
  });
  
  // Render insights
  if (insights.length === 0) {
    insightsGrid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💡</div><p>No insights available yet</p></div>';
  } else {
    insightsGrid.innerHTML = insights.map(insight => `
      <div class="insight-card">
        <div class="insight-header">
          <span class="insight-icon">${insight.icon}</span>
          <h4 class="insight-title">${insight.title}</h4>
        </div>
        <p class="insight-description">${insight.description}</p>
      </div>
    `).join('');
  }
}

// Data Transformations
function setupTransformations() {
  // Populate column selects
  const selects = [
    'calc-col-a', 'calc-col-b', 'group-by-column', 
    'aggregate-column', 'replace-column'
  ];
  
  selects.forEach(id => {
    const select = document.getElementById(id);
    select.innerHTML = appState.columns.map(col => 
      `<option value="${col}">${col}</option>`
    ).join('');
  });
  
  // Calculate column
  document.getElementById('apply-calc-btn').addEventListener('click', () => {
    const newColName = document.getElementById('calc-column-name').value;
    const operation = document.getElementById('calc-operation').value;
    const colA = document.getElementById('calc-col-a').value;
    const colB = document.getElementById('calc-col-b').value;
    
    if (!newColName) {
      showToast('Please enter a column name', 'error');
      return;
    }
    
    appState.rawData.forEach(row => {
      const valA = parseFloat(row[colA]) || 0;
      const valB = parseFloat(row[colB]) || 0;
      
      switch (operation) {
        case 'sum':
          row[newColName] = (valA + valB).toFixed(2);
          break;
        case 'difference':
          row[newColName] = (valA - valB).toFixed(2);
          break;
        case 'product':
          row[newColName] = (valA * valB).toFixed(2);
          break;
        case 'percentage':
          row[newColName] = valB !== 0 ? ((valA / valB) * 100).toFixed(2) + '%' : '0%';
          break;
      }
    });
    
    if (!appState.columns.includes(newColName)) {
      appState.columns.push(newColName);
    }
    
    renderDataTable();
    renderStatistics();
    showToast(`Column "${newColName}" created successfully`, 'success');
  });
  
  // Group by
  document.getElementById('apply-group-btn').addEventListener('click', () => {
    const groupByCol = document.getElementById('group-by-column').value;
    const aggCol = document.getElementById('aggregate-column').value;
    const aggFunc = document.getElementById('aggregate-function').value;
    
    const grouped = {};
    appState.rawData.forEach(row => {
      const key = row[groupByCol];
      if (!grouped[key]) grouped[key] = [];
      if (isNumeric(row[aggCol])) {
        grouped[key].push(parseFloat(row[aggCol]));
      }
    });
    
    const result = Object.entries(grouped).map(([key, values]) => {
      let aggValue;
      switch (aggFunc) {
        case 'sum':
          aggValue = values.reduce((a, b) => a + b, 0);
          break;
        case 'average':
          aggValue = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case 'count':
          aggValue = values.length;
          break;
        case 'min':
          aggValue = Math.min(...values);
          break;
        case 'max':
          aggValue = Math.max(...values);
          break;
      }
      return {
        [groupByCol]: key,
        [`${aggFunc}_${aggCol}`]: aggValue.toFixed(2),
        count: values.length
      };
    });
    
    appState.rawData = result;
    appState.columns = Object.keys(result[0]);
    renderDataTable();
    renderStatistics();
    showToast('Data grouped successfully', 'success');
  });
  
  // Remove duplicates
  document.getElementById('remove-duplicates-btn').addEventListener('click', () => {
    const originalLength = appState.rawData.length;
    const seen = new Set();
    appState.rawData = appState.rawData.filter(row => {
      const key = JSON.stringify(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    
    const removed = originalLength - appState.rawData.length;
    renderDataTable();
    renderStatistics();
    showToast(`Removed ${removed} duplicate rows`, 'success');
  });
  
  // Fill missing values
  document.getElementById('fill-missing-btn').addEventListener('click', () => {
    const method = document.getElementById('fill-method').value;
    
    if (method === 'remove') {
      const originalLength = appState.rawData.length;
      appState.rawData = appState.rawData.filter(row => {
        return appState.columns.every(col => row[col] && row[col] !== '');
      });
      const removed = originalLength - appState.rawData.length;
      showToast(`Removed ${removed} rows with missing values`, 'success');
    } else {
      appState.columns.forEach(col => {
        if (getColumnType(col) !== 'numeric') return;
        
        const values = appState.rawData.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
        let fillValue;
        
        switch (method) {
          case 'mean':
            fillValue = values.reduce((a, b) => a + b, 0) / values.length;
            break;
          case 'median':
            const sorted = [...values].sort((a, b) => a - b);
            fillValue = sorted[Math.floor(sorted.length / 2)];
            break;
          case 'zero':
            fillValue = 0;
            break;
        }
        
        appState.rawData.forEach(row => {
          if (!row[col] || row[col] === '' || isNaN(parseFloat(row[col]))) {
            row[col] = fillValue.toFixed(2);
          }
        });
      });
      showToast('Missing values filled', 'success');
    }
    
    renderDataTable();
    renderStatistics();
  });
  
  // Find & Replace
  document.getElementById('apply-replace-btn').addEventListener('click', () => {
    const column = document.getElementById('replace-column').value;
    const findValue = document.getElementById('find-value').value;
    const replaceValue = document.getElementById('replace-value').value;
    
    if (!findValue) {
      showToast('Please enter a value to find', 'error');
      return;
    }
    
    let count = 0;
    appState.rawData.forEach(row => {
      if (row[column] === findValue) {
        row[column] = replaceValue;
        count++;
      }
    });
    
    renderDataTable();
    showToast(`Replaced ${count} occurrences`, 'success');
  });
}

// Export Functions
function setupExport() {
  document.getElementById('export-csv-btn').addEventListener('click', exportToCSV);
  document.getElementById('export-json-btn').addEventListener('click', exportToJSON);
  document.getElementById('export-chart-btn').addEventListener('click', downloadChart);
  document.getElementById('export-report-btn').addEventListener('click', exportReport);
}

function exportToCSV() {
  const headers = appState.columns.join(',');
  const rows = appState.filteredData.map(row => 
    appState.columns.map(col => row[col]).join(',')
  ).join('\n');
  
  const csv = `${headers}\n${rows}`;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = 'data_export.csv';
  link.href = url;
  link.click();
  showToast('CSV exported successfully', 'success');
}

function exportToJSON() {
  const json = JSON.stringify(appState.filteredData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = 'data_export.json';
  link.href = url;
  link.click();
  showToast('JSON exported successfully', 'success');
}

function exportReport() {
  const report = [];
  report.push('DATA ANALYSIS REPORT');
  report.push('='.repeat(50));
  report.push('');
  report.push(`Total Rows: ${appState.rawData.length}`);
  report.push(`Total Columns: ${appState.columns.length}`);
  report.push(`Missing Values: ${countMissingValues()}`);
  report.push('');
  report.push('COLUMN STATISTICS');
  report.push('-'.repeat(50));
  
  appState.columns.forEach(col => {
    const stats = calculateStats(col);
    report.push(`\n${col}:`);
    Object.entries(stats).forEach(([key, value]) => {
      report.push(`  ${key}: ${value}`);
    });
  });
  
  const text = report.join('\n');
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = 'statistical_report.txt';
  link.href = url;
  link.click();
  showToast('Report exported successfully', 'success');
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupFileUpload();
});