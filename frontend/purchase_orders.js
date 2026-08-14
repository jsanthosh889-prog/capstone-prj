// Check Auth
checkAuthentication();

const user = getLoggedInUser();
const poForm = document.getElementById('po-form');
const poIdInput = document.getElementById('po-id');
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');
const vendorNameInput = document.getElementById('vendorName');
const amountInput = document.getElementById('amount');
const formTitle = document.getElementById('form-title');
const cancelBtn = document.getElementById('cancel-btn');
const poListBody = document.getElementById('po-list-body');
const errorDiv = document.getElementById('error-message');

const API_PO_URL = 'http://localhost:8080/api/purchase-orders';

// Render navigation options depending on role
if (user) {
    if (user.role === 'REQUESTER') {
        document.getElementById('nav-approvals').style.display = 'none';
    }
}

// Fetch list of Purchase Orders
async function loadPurchaseOrders() {
    try {
        const token = getAuthToken();
        const response = await fetch(API_PO_URL, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch purchase orders.');
        }
        
        const pos = await response.json();
        renderPOList(pos);
    } catch (err) {
        poListBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--error);">${err.message}</td></tr>`;
    }
}

// Render tables
function renderPOList(pos) {
    if (pos.length === 0) {
        poListBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 2rem;">No purchase orders found.</td></tr>`;
        return;
    }
    
    poListBody.innerHTML = pos.map(po => {
        const isDraft = po.status === 'DRAFT';
        
        // Conditional buttons
        const actionButtons = isDraft ? `
            <button class="action-btn btn-submit" onclick="submitPO(${po.id})">Submit</button>
            <button class="action-btn btn-edit" onclick="editPO(${po.id}, '${escapeHtml(po.title)}', '${escapeHtml(po.description || '')}', '${escapeHtml(po.vendorName)}', ${po.amount})">Edit</button>
            <button class="action-btn btn-delete" onclick="deletePO(${po.id})">Delete</button>
        ` : `<span style="color: var(--text-muted); font-size: 0.85rem;">No actions</span>`;
        
        return `
            <tr>
                <td style="font-weight: 600;">${po.poNumber}</td>
                <td>${escapeHtml(po.title)}</td>
                <td>${escapeHtml(po.vendorName)}</td>
                <td style="font-weight: 500;">$${po.amount.toFixed(2)}</td>
                <td><span class="badge-status status-${po.status.toLowerCase()}">${po.status.replace('_', ' ')}</span></td>
                <td>${actionButtons}</td>
            </tr>
        `;
    }).join('');
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

// Create/Update Submit Form
poForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.style.display = 'none';
    
    const id = poIdInput.value;
    const poData = {
        title: titleInput.value,
        description: descriptionInput.value,
        vendorName: vendorNameInput.value,
        amount: parseFloat(amountInput.value)
    };
    
    try {
        const token = getAuthToken();
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_PO_URL}/${id}` : API_PO_URL;
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(poData)
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to save purchase order.');
        }
        
        // Reset form & reload
        resetForm();
        loadPurchaseOrders();
    } catch (err) {
        errorDiv.innerText = err.message;
        errorDiv.style.display = 'block';
    }
});

// Edit Setup Action
window.editPO = function(id, title, description, vendorName, amount) {
    poIdInput.value = id;
    titleInput.value = title;
    descriptionInput.value = description;
    vendorNameInput.value = vendorName;
    amountInput.value = amount;
    
    formTitle.innerText = 'Edit Purchase Order';
    cancelBtn.style.display = 'inline-block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Reset Form
function resetForm() {
    poIdInput.value = '';
    poForm.reset();
    formTitle.innerText = 'Create Purchase Order';
    cancelBtn.style.display = 'none';
}

cancelBtn.addEventListener('click', resetForm);

// Delete Action
window.deletePO = async function(id) {
    if (!confirm('Are you sure you want to delete this purchase order?')) return;
    
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_PO_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to delete purchase order.');
        }
        
        loadPurchaseOrders();
    } catch (err) {
        alert(err.message);
    }
};

// Submit Action
window.submitPO = async function(id) {
    if (!confirm('Submit this Purchase Order for Approval? Once submitted, it cannot be edited.')) return;
    
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_PO_URL}/${id}/submit`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to submit purchase order.');
        }
        
        loadPurchaseOrders();
    } catch (err) {
        alert(err.message);
    }
};

// Log out listener
document.getElementById('logout-btn').addEventListener('click', logout);

// Initial Load
loadPurchaseOrders();
