// Check Authentication
checkAuthentication();

const user = getLoggedInUser();
if (user) {
    if (user.role === 'REQUESTER') {
        document.getElementById('nav-approvals').style.display = 'none';
    } else {
        // Approvers/Admins do not need the Create button as they don't request POs
        const createBtn = document.getElementById('create-po-btn');
        if (createBtn) createBtn.style.display = 'none';
    }
}

// Elements
const searchInput = document.getElementById('search-input');
const statusSelect = document.getElementById('status-select');
const searchBtn = document.getElementById('search-btn');
const clearBtn = document.getElementById('clear-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const pageInfo = document.getElementById('page-info');
const poListBody = document.getElementById('po-list-body');

// Client State
let currentPage = 0;
const pageSize = 5; // Using 5 rows per page for clear pagination verification
let currentStatus = 'ALL';
let currentSearch = '';
let totalPages = 0;

const API_PO_URL = 'http://localhost:8080/api/purchase-orders';

// Fetch paged data
async function fetchPagedPOs() {
    try {
        const token = getAuthToken();
        const url = new URL(API_PO_URL);
        url.searchParams.append('page', currentPage);
        url.searchParams.append('size', pageSize);
        url.searchParams.append('status', currentStatus);
        url.searchParams.append('search', currentSearch);

        poListBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 2rem;">Loading purchase orders...</td></tr>`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to retrieve purchase orders.');
        }

        const data = await response.json();
        totalPages = data.totalPages;
        
        renderTable(data.content);
        updatePaginationControls(data.currentPage, data.totalPages);
    } catch (err) {
        poListBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--error); padding: 2rem;">${err.message}</td></tr>`;
    }
}

// Render content
function renderTable(pos) {
    if (pos.length === 0) {
        poListBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 3rem; font-weight: 500;">No Purchase Orders found.</td></tr>`;
        return;
    }

    poListBody.innerHTML = pos.map(po => {
        const date = new Date(po.createdAt);
        
        // Requester Action -> Go to draft page
        const actionBtn = (user.role === 'REQUESTER' && po.status === 'DRAFT')
            ? `<a href="purchase_orders.html" class="btn-action">Edit Draft</a>`
            : `<a href="#" class="btn-action" style="background: rgba(255,255,255,0.05); color: var(--text-secondary); border: 1px solid var(--border-color); cursor: default;">View</a>`;

        return `
            <tr>
                <td style="font-weight: 600; color: var(--accent);">${po.poNumber}</td>
                <td>${escapeHtml(po.title)}</td>
                <td>${escapeHtml(po.vendorName)}</td>
                <td style="font-weight: 500;">$${po.amount.toFixed(2)}</td>
                <td><span class="badge-status status-${po.status.toLowerCase()}">${po.status.replace('_', ' ')}</span></td>
                <td style="font-size: 0.9rem; color: var(--text-secondary);">${date.toLocaleDateString()}</td>
                <td>${actionBtn}</td>
            </tr>
        `;
    }).join('');
}

// Update UI page buttons
function updatePaginationControls(current, total) {
    prevBtn.disabled = current <= 0;
    nextBtn.disabled = current >= total - 1 || total === 0;

    // Output human-readable 1-indexed page info
    const displayPage = total === 0 ? 0 : current + 1;
    pageInfo.innerText = `Page ${displayPage} of ${total}`;
}

// Escape HTML utility
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
}

// Event Listeners
searchBtn.addEventListener('click', () => {
    currentSearch = searchInput.value;
    currentStatus = statusSelect.value;
    currentPage = 0; // Reset to page 1 on new search
    fetchPagedPOs();
});

clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    statusSelect.value = 'ALL';
    currentSearch = '';
    currentStatus = 'ALL';
    currentPage = 0;
    fetchPagedPOs();
});

prevBtn.addEventListener('click', () => {
    if (currentPage > 0) {
        currentPage--;
        fetchPagedPOs();
    }
});

nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages - 1) {
        currentPage++;
        fetchPagedPOs();
    }
});

// Logout listener
document.getElementById('logout-btn').addEventListener('click', logout);

// Initial Fetch
fetchPagedPOs();

// Connect to realtime updates
connectSupabaseRealtime((change) => {
    console.log('Realtime purchase order update received:', change);
    fetchPagedPOs();
});
