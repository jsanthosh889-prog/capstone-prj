// Check Auth
checkAuthentication();

const user = getLoggedInUser();
if (user) {
    if (user.role === 'REQUESTER') {
        alert('Access Denied: Requesters are not authorized to view the Approvals page.');
        window.location.href = 'dashboard.html';
    }
}

const pendingList = document.getElementById('pending-list');
const emptyDetails = document.getElementById('empty-details');
const poDetails = document.getElementById('po-details');

const detailPoNumber = document.getElementById('detail-ponumber');
const detailTitle = document.getElementById('detail-title');
const detailVendor = document.getElementById('detail-vendor');
const detailAmount = document.getElementById('detail-amount');
const detailRequester = document.getElementById('detail-requester');
const detailCreated = document.getElementById('detail-created');
const detailDescription = document.getElementById('detail-description');

const approveBtn = document.getElementById('approve-btn');
const rejectBtn = document.getElementById('reject-btn');
const successBanner = document.getElementById('success-banner');

// Modal Elements
const rejectModal = document.getElementById('reject-modal');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const modalSubmitReject = document.getElementById('modal-submit-reject');
const rejectCommentsInput = document.getElementById('reject-comments');

const API_PO_URL = 'http://localhost:8080/api/purchase-orders';

let pendingPOs = [];
let selectedPO = null;

// Load all pending POs
async function loadPendingPOs() {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_PO_URL}/pending`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load pending purchase orders.');
        }
        
        pendingPOs = await response.json();
        renderPendingList();
        
        // Reset selected PO
        selectedPO = null;
        poDetails.style.display = 'none';
        emptyDetails.style.display = 'block';
    } catch (err) {
        pendingList.innerHTML = `<div style="text-align: center; color: var(--error);">${err.message}</div>`;
    }
}

// Render left list
function renderPendingList() {
    if (pendingPOs.length === 0) {
        pendingList.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 2rem;">No pending purchase orders to review.</div>`;
        return;
    }
    
    pendingList.innerHTML = pendingPOs.map(po => `
        <div class="po-item-card" id="po-card-${po.id}" onclick="selectPO(${po.id})">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                <span style="font-weight: 700; color: var(--accent);">${po.poNumber}</span>
                <span style="font-weight: 600;">$${po.amount.toFixed(2)}</span>
            </div>
            <div style="font-weight: 500; font-size: 0.95rem; margin-bottom: 0.2rem;">${escapeHtml(po.title)}</div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);">Vendor: ${escapeHtml(po.vendorName)}</div>
        </div>
    `).join('');
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

// Select specific PO
window.selectPO = function(id) {
    // Highlight selected card
    const cards = document.querySelectorAll('.po-item-card');
    cards.forEach(c => c.classList.remove('active'));
    
    const selectedCard = document.getElementById(`po-card-${id}`);
    if (selectedCard) selectedCard.classList.add('active');
    
    selectedPO = pendingPOs.find(po => po.id === id);
    if (!selectedPO) return;
    
    // Display Details
    emptyDetails.style.display = 'none';
    poDetails.style.display = 'block';
    
    detailPoNumber.innerText = selectedPO.poNumber;
    detailTitle.innerText = selectedPO.title;
    detailVendor.innerText = selectedPO.vendorName;
    detailAmount.innerText = `$${selectedPO.amount.toFixed(2)}`;
    detailRequester.innerText = selectedPO.createdByUsername;
    detailDescription.innerText = selectedPO.description || 'No description provided.';
    
    const date = new Date(selectedPO.createdAt);
    detailCreated.innerText = date.toLocaleString();
};

// Approve PO Action
approveBtn.addEventListener('click', async () => {
    if (!selectedPO) return;
    if (!confirm(`Are you sure you want to APPROVE Purchase Order ${selectedPO.poNumber}?`)) return;
    
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_PO_URL}/${selectedPO.id}/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ comments: 'Approved via web dashboard.' })
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to approve purchase order.');
        }
        
        showSuccessBanner(`Purchase Order ${selectedPO.poNumber} has been APPROVED.`);
        loadPendingPOs();
    } catch (err) {
        alert(err.message);
    }
});

// Reject PO Dialog actions
rejectBtn.addEventListener('click', () => {
    if (!selectedPO) return;
    rejectCommentsInput.value = '';
    rejectModal.style.display = 'flex';
});

modalCancelBtn.addEventListener('click', () => {
    rejectModal.style.display = 'none';
});

modalSubmitReject.addEventListener('click', async () => {
    const comment = rejectCommentsInput.value.trim();
    if (!comment) {
        alert('Rejection comments/reason is mandatory.');
        return;
    }
    
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_PO_URL}/${selectedPO.id}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ comments: comment })
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to reject purchase order.');
        }
        
        rejectModal.style.display = 'none';
        showSuccessBanner(`Purchase Order ${selectedPO.poNumber} has been REJECTED.`);
        loadPendingPOs();
    } catch (err) {
        alert(err.message);
    }
});

// Helper for banner
function showSuccessBanner(message) {
    successBanner.innerText = message;
    successBanner.style.display = 'block';
    setTimeout(() => {
        successBanner.style.display = 'none';
    }, 4000);
}

// Log out listener
document.getElementById('logout-btn').addEventListener('click', logout);

// Initial load
loadPendingPOs();

// Connect to realtime updates
connectSupabaseRealtime((change) => {
    console.log('Realtime purchase order update received:', change);
    loadPendingPOs();
});
