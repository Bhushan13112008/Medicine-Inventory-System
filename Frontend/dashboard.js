document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('userToken');
  const userEmail = localStorage.getItem('userEmail');

  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  if (userEmail) {
    const userDisplay = document.getElementById('user-display-email');
    if (userDisplay) userDisplay.textContent = userEmail;
  }

  const tableBody = document.getElementById('medicine-table-body');
  const searchInput = document.getElementById('search-input');
  const logoutBtn = document.getElementById('logoutBtn');
  const totalCountEl = document.getElementById('total-medicines-count');
  const lowStockCountEl = document.getElementById('low-stock-count');
  const categoriesCountEl = document.getElementById('categories-count');

  // Detail Modal Elements
  const detailsModal = document.getElementById('details-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const modalContent = document.getElementById('modal-details-content');

  // Update Modal Elements
  const updateModal = document.getElementById('update-modal');
  const updateForm = document.getElementById('update-medicine-form');
  const closeUpdateModalBtn = document.getElementById('close-update-modal-btn');
  const cancelUpdateBtn = document.getElementById('cancel-update-btn');
  const toggleMoreFieldsBtn = document.getElementById('toggle-more-fields-btn');
  const moreFieldsContainer = document.getElementById('more-fields-container');

  // Add Modal Elements
  const addBtn = document.getElementById('add-medicine-btn');
  const addModal = document.getElementById('add-modal');
  const addForm = document.getElementById('add-medicine-form');
  const closeAddModalBtn = document.getElementById('close-add-modal-btn');
  const cancelAddBtn = document.getElementById('cancel-add-btn');
  const toggleAddMoreFieldsBtn = document.getElementById('toggle-add-more-fields-btn');
  const addMoreFieldsContainer = document.getElementById('add-more-fields-container');

  let inventoryData = [];

  // Fetch Inventory from FastAPI
  async function fetchMedicines() {
    try {
      const response = await fetch('http://127.0.0.1:8000/medicine/medicines', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401 || response.status === 403) {
        handleLogout();
        return;
      }

      if (!response.ok) throw new Error('Failed to load inventory data');

      inventoryData = await response.json();
      renderTable(inventoryData);
      updateStats(inventoryData);

    } catch (error) {
      console.error('Error fetching inventory:', error);
      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" class="empty-state" style="color: var(--danger-color);">
              Error loading inventory. Please check backend connection.
            </td>
          </tr>`;
      }
    }
  }

  // Render Rows
  function renderTable(medicines) {
    if (!tableBody) return;

    if (!medicines || medicines.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state">No medicines found in inventory.</td>
        </tr>`;
      return;
    }

    tableBody.innerHTML = medicines.map(item => {
      const qty = item.stock_quantity ?? item.quantity ?? item.stock ?? 0;
      const rawPrice = item.unit_price ?? item.price ?? 0;
      const numericPrice = parseFloat(rawPrice);
      const displayPrice = isNaN(numericPrice) ? '$0.00' : `$${numericPrice.toFixed(2)}`;

      return `
        <tr>
          <td>${String(item.id || '').substring(0, 8)}...</td>
          <td><strong>${escapeHtml(item.name || 'Unnamed Item')}</strong></td>
          <td>${escapeHtml(item.category || 'N/A')}</td>
          <td>${qty}</td>
          <td>${displayPrice}</td>
          <td>
            <div class="action-menu-container">
              <button class="dots-btn" onclick="toggleActionMenu(event, '${item.id}')">&#8942;</button>
              <div id="dropdown-${item.id}" class="action-dropdown">
                <button onclick="handleView('${item.id}')">View</button>
                <button onclick="handleUpdate('${item.id}')">Update</button>
                <button class="delete-btn" onclick="handleDelete('${item.id}')">Delete</button>
              </div>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Action Menu Toggle
  window.toggleActionMenu = (event, id) => {
    event.stopPropagation();
    document.querySelectorAll('.action-dropdown').forEach(menu => {
      if (menu.id !== `dropdown-${id}`) menu.classList.remove('active');
    });

    const currentMenu = document.getElementById(`dropdown-${id}`);
    if (currentMenu) currentMenu.classList.toggle('active');
  };

  document.addEventListener('click', () => {
    document.querySelectorAll('.action-dropdown').forEach(menu => menu.classList.remove('active'));
  });

  // Action: View Details
  window.handleView = (id) => {
    const medicine = inventoryData.find(m => String(m.id) === String(id));
    if (!medicine || !modalContent) return;

    modalContent.innerHTML = Object.entries(medicine)
      .map(([key, value]) => `
        <div class="detail-row">
          <span>${key.toUpperCase()}</span>
          <strong>${value !== null && value !== undefined ? escapeHtml(String(value)) : 'N/A'}</strong>
        </div>
      `).join('');

    if (detailsModal) detailsModal.classList.remove('hidden');
  };

  // --- Add Medicine Logic ---
  if (addBtn && addModal) {
    addBtn.addEventListener('click', () => {
      if (addForm) addForm.reset();
      if (addMoreFieldsContainer) addMoreFieldsContainer.classList.add('hidden');
      if (toggleAddMoreFieldsBtn) toggleAddMoreFieldsBtn.textContent = '+ More Details';
      addModal.classList.remove('hidden');
    });
  }

  if (toggleAddMoreFieldsBtn && addMoreFieldsContainer) {
    toggleAddMoreFieldsBtn.addEventListener('click', () => {
      const isHidden = addMoreFieldsContainer.classList.contains('hidden');
      if (isHidden) {
        addMoreFieldsContainer.classList.remove('hidden');
        toggleAddMoreFieldsBtn.textContent = '- Less Details';
      } else {
        addMoreFieldsContainer.classList.add('hidden');
        toggleAddMoreFieldsBtn.textContent = '+ More Details';
      }
    });
  }

  if (addForm) {
    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const payload = {
        name: document.getElementById('add-name').value.trim(),
        category: document.getElementById('add-category').value.trim(),
        stock_quantity: parseInt(document.getElementById('add-quantity').value, 10),
        unit_price: parseFloat(document.getElementById('add-price').value),
        generic_name: document.getElementById('add-generic-name').value.trim() || null,
        dosage_form: document.getElementById('add-dosage-form').value.trim() || null,
        strength: document.getElementById('add-strength').value.trim() || null,
        reorder: parseInt(document.getElementById('add-reorder').value, 10) || 0,
        expiry_date: document.getElementById('add-expiry-date').value || null,
        manufacturer: document.getElementById('add-manufacturer').value.trim() || null
      };

      try {
        const response = await fetch('http://127.0.0.1:8000/medicine/create_medicine', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
            
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          addModal.classList.add('hidden');
          addForm.reset();
          fetchMedicines(); // Refresh table
        } else {
          const errData = await response.json();
          alert(errData.detail || 'Failed to add medicine record.');
        }
      } catch (error) {
        console.error('Add medicine request failed:', error);
        alert('Error connecting to backend server.');
      }
    });
  }

  // --- Update Medicine Logic ---
  if (toggleMoreFieldsBtn && moreFieldsContainer) {
    toggleMoreFieldsBtn.addEventListener('click', () => {
      const isHidden = moreFieldsContainer.classList.contains('hidden');
      if (isHidden) {
        moreFieldsContainer.classList.remove('hidden');
        toggleMoreFieldsBtn.textContent = '- Less Details';
      } else {
        moreFieldsContainer.classList.add('hidden');
        toggleMoreFieldsBtn.textContent = '+ More Details';
      }
    });
  }

  window.handleUpdate = (id) => {
    const medicine = inventoryData.find(m => String(m.id) === String(id));
    if (!medicine || !updateModal) return;

    if (moreFieldsContainer) moreFieldsContainer.classList.add('hidden');
    if (toggleMoreFieldsBtn) toggleMoreFieldsBtn.textContent = '+ More Details';

    document.getElementById('update-id').value = medicine.id;
    document.getElementById('update-name').value = medicine.name || '';
    document.getElementById('update-category').value = medicine.category || '';
    document.getElementById('update-quantity').value = medicine.stock_quantity ?? medicine.quantity ?? medicine.stock ?? 0;
    document.getElementById('update-price').value = medicine.unit_price ?? medicine.price ?? 0;

    document.getElementById('update-generic-name').value = medicine.generic_name || '';
    document.getElementById('update-dosage-form').value = medicine.dosage_form || '';
    document.getElementById('update-strength').value = medicine.strength || '';
    document.getElementById('update-reorder').value = medicine.reorder ?? 0;
    
    let formattedDate = '';
    if (medicine.expiry_date) {
      formattedDate = String(medicine.expiry_date).split('T')[0];
    }
    document.getElementById('update-expiry-date').value = formattedDate;
    document.getElementById('update-manufacturer').value = medicine.manufacturer || '';

    updateModal.classList.remove('hidden');
  };

  if (updateForm) {
    updateForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('update-id').value;

      const payload = {
        name: document.getElementById('update-name').value.trim(),
        category: document.getElementById('update-category').value.trim(),
        stock_quantity: parseInt(document.getElementById('update-quantity').value, 10),
        unit_price: parseFloat(document.getElementById('update-price').value),
        generic_name: document.getElementById('update-generic-name').value.trim() || null,
        dosage_form: document.getElementById('update-dosage-form').value.trim() || null,
        strength: document.getElementById('update-strength').value.trim() || null,
        reorder: parseInt(document.getElementById('update-reorder').value, 10) || 0,
        expiry_date: document.getElementById('update-expiry-date').value || null,
        manufacturer: document.getElementById('update-manufacturer').value.trim() || null
      };

      try {
        const response = await fetch(`http://127.0.0.1:8000/medicine/medicines/${id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          updateModal.classList.add('hidden');
          fetchMedicines();
        } else {
          const errData = await response.json();
          alert(errData.detail || 'Failed to update medicine record.');
        }
      } catch (error) {
        console.error('Update request error:', error);
        alert('Error connecting to backend server.');
      }
    });
  }

  // Delete Action
  window.handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this medicine?')) return;

    try {
      const response = await fetch(`http://127.0.0.1:8000/medicine/medicines/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchMedicines();
      } else {
        alert('Failed to delete medicine from database.');
      }
    } catch (error) {
      console.error('Delete request error:', error);
      alert('Error connecting to backend server.');
    }
  };

  // Modal Closers
  if (closeModalBtn && detailsModal) {
    closeModalBtn.addEventListener('click', () => detailsModal.classList.add('hidden'));
  }
  if (closeUpdateModalBtn && updateModal) {
    closeUpdateModalBtn.addEventListener('click', () => updateModal.classList.add('hidden'));
  }
  if (cancelUpdateBtn && updateModal) {
    cancelUpdateBtn.addEventListener('click', () => updateModal.classList.add('hidden'));
  }
  if (closeAddModalBtn && addModal) {
    closeAddModalBtn.addEventListener('click', () => addModal.classList.add('hidden'));
  }
  if (cancelAddBtn && addModal) {
    cancelAddBtn.addEventListener('click', () => addModal.classList.add('hidden'));
  }

  window.addEventListener('click', (e) => {
    if (detailsModal && e.target === detailsModal) detailsModal.classList.add('hidden');
    if (updateModal && e.target === updateModal) updateModal.classList.add('hidden');
    if (addModal && e.target === addModal) addModal.classList.add('hidden');
  });

  // Calculate Stats
  function updateStats(medicines) {
    if (totalCountEl) totalCountEl.textContent = medicines.length;
    if (lowStockCountEl) {
      lowStockCountEl.textContent = medicines.filter(m => {
        const q = m.stock_quantity ?? m.quantity ?? m.stock ?? 0;
        return q < 10;
      }).length;
    }
    if (categoriesCountEl) {
      const categories = new Set(medicines.map(m => m.category).filter(Boolean));
      categoriesCountEl.textContent = categories.size;
    }
  }

  // Search Filter
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const filtered = inventoryData.filter(item => 
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.category && item.category.toLowerCase().includes(query)) ||
        (item.generic_name && item.generic_name.toLowerCase().includes(query))
      );
      renderTable(filtered);
    });
  }

  // Logout
  function handleLogout() {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userEmail');
    window.location.href = 'login.html';
  }

  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  fetchMedicines();
});

const API_BASE = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", () => {
    const userEmail = localStorage.getItem("userEmail") || "";
    
    // Display user email on button if present
    const userEmailDisplay = document.getElementById("userEmailDisplay");
    if (userEmailDisplay && userEmail) {
        userEmailDisplay.textContent = userEmail;
    }

    // --- Dropdown Menu Toggle ---
    const userMenuBtn = document.getElementById("userMenuBtn");
    const userDropdown = document.getElementById("userDropdown");

    userMenuBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle("show");
    });

    window.addEventListener("click", () => {
        userDropdown?.classList.remove("show");
    });

    // --- Account Modals Open / Close ---
    const updatePasswordModal = document.getElementById("updatePasswordModal");
    const deleteAccountModal = document.getElementById("deleteAccountModal");

    document.getElementById("openUpdatePasswordBtn")?.addEventListener("click", () => {
        const updateEmailInput = document.getElementById("updateEmail");
        if (updateEmailInput) updateEmailInput.value = userEmail;
        
        const statusEl = document.getElementById("updatePasswordStatus");
        if (statusEl) statusEl.textContent = "";

        updatePasswordModal?.classList.remove("hidden");
    });

    document.getElementById("closeUpdatePasswordModal")?.addEventListener("click", () => {
        updatePasswordModal?.classList.add("hidden");
    });

    document.getElementById("openDeleteAccountBtn")?.addEventListener("click", () => {
        const deleteEmailInput = document.getElementById("deleteEmail");
        if (deleteEmailInput) deleteEmailInput.value = userEmail;

        const statusEl = document.getElementById("deleteAccountStatus");
        if (statusEl) statusEl.textContent = "";

        deleteAccountModal?.classList.remove("hidden");
    });

    document.getElementById("closeDeleteAccountModal")?.addEventListener("click", () => {
        deleteAccountModal?.classList.add("hidden");
    });

    // --- Update Password Logic ---
    const updateForm = document.getElementById("updatePasswordForm");
    updateForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const statusEl = document.getElementById("updatePasswordStatus");
        if (statusEl) {
            statusEl.style.color = "#94a3b8";
            statusEl.textContent = "Updating password...";
        }

        const email = document.getElementById("updateEmail").value;
        const current_password = document.getElementById("currentPassword").value;
        const new_password = document.getElementById("newPassword").value;

        try {
            const res = await fetch(`${API_BASE}/login/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, current_password, new_password })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Failed to update password");

            if (statusEl) {
                statusEl.style.color = "#4ade80";
                statusEl.textContent = data.message || "Password updated successfully!";
            }
            setTimeout(() => {
                updatePasswordModal?.classList.add("hidden");
                updateForm.reset();
            }, 1500);
        } catch (err) {
            if (statusEl) {
                statusEl.style.color = "#f87171";
                statusEl.textContent = err.message;
            }
        }
    });

    // --- Request OTP for Account Deletion ---
    const sendOtpBtn = document.getElementById("sendDeleteOtpBtn");
    sendOtpBtn?.addEventListener("click", async () => {
        const statusEl = document.getElementById("deleteAccountStatus");
        if (statusEl) {
            statusEl.style.color = "#94a3b8";
            statusEl.textContent = "Sending OTP...";
        }

        const email = document.getElementById("deleteEmail").value;

        try {
            const res = await fetch(`${API_BASE}/login/delete-otp-request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Failed to send OTP");

            if (statusEl) {
                statusEl.style.color = "#4ade80";
                statusEl.textContent = data.message || "OTP sent to your email!";
            }
        } catch (err) {
            if (statusEl) {
                statusEl.style.color = "#f87171";
                statusEl.textContent = err.message;
            }
        }
    });

    // --- Delete Account Logic ---
    const deleteForm = document.getElementById("deleteAccountForm");
    deleteForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const statusEl = document.getElementById("deleteAccountStatus");
        if (statusEl) {
            statusEl.style.color = "#94a3b8";
            statusEl.textContent = "Deleting account...";
        }

        const email = document.getElementById("deleteEmail").value;
        const otp = document.getElementById("deleteOtp").value;

        try {
            const res = await fetch(`${API_BASE}/login/delete_account`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Failed to delete account");

            alert("Account deleted successfully.");
            localStorage.clear();
            window.location.href = "login.html";
        } catch (err) {
            if (statusEl) {
                statusEl.style.color = "#f87171";
                statusEl.textContent = err.message;
            }
        }
    });
});