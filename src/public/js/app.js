// Client-side Application Logic
document.addEventListener('DOMContentLoaded', () => {
  // State
  let state = {
    appointments: [],
    users: [],
    currentPage: 1,
    totalPages: 1,
    totalCount: 392,
    activeTab: 'All',
    searchQuery: '',
    excludeReferral: true,
    selectedIds: new Set(),
    selectedAppointment: null,
    activeJobId: null
  };

  // Socket.IO
  const socket = io();

  socket.on('connect', () => {
    console.log('[Socket] Connected to server.');
  });

  socket.on('appointments-refresh', () => {
    fetchAppointments();
    fetchUsers();
  });

  socket.on('bulk-job-progress', (data) => {
    updateJobProgressUI(data);
  });

  // DOM Elements
  const appointmentsTableBody = document.getElementById('appointmentsTableBody');
  const searchInput = document.getElementById('searchInput');
  const excludeReferralCheckbox = document.getElementById('excludeReferralCheckbox');
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  const selectionBanner = document.getElementById('selectionBanner');
  const selectedCountText = document.getElementById('selectedCountText');
  const selectedBadgeNum = document.getElementById('selectedBadgeNum');
  const reassignSelectedBtn = document.getElementById('reassignSelectedBtn');
  const clearSelectionBtn = document.getElementById('clearSelectionBtn');
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');
  const paginationInfo = document.getElementById('paginationInfo');
  const pageNumDisplay = document.getElementById('pageNumDisplay');
  const totalApptCountBadge = document.getElementById('totalApptCountBadge');

  // Counts
  const countAll = document.getElementById('countAll');
  const countConsultation = document.getElementById('countConsultation');
  const countDelivery = document.getElementById('countDelivery');
  const countCancelled = document.getElementById('countCancelled');

  // Detail Drawer Elements
  const detailDrawer = document.getElementById('detailDrawer');
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');
  const drawerOrderId = document.getElementById('drawerOrderId');
  const drawerStatusPill = document.getElementById('drawerStatusPill');
  const drawerNextStep = document.getElementById('drawerNextStep');
  const drawerPriority = document.getElementById('drawerPriority');
  const drawerPatientTitle = document.getElementById('drawerPatientTitle');
  const drawerAssigneeSelect = document.getElementById('drawerAssigneeSelect');
  const drawerCoachSelect = document.getElementById('drawerCoachSelect');
  const drawerPcOpsSelect = document.getElementById('drawerPcOpsSelect');
  const drawerDueDateInput = document.getElementById('drawerDueDateInput');
  const drawerCreatedDate = document.getElementById('drawerCreatedDate');
  const drawerCreatedBy = document.getElementById('drawerCreatedBy');
  const drawerRevenue = document.getElementById('drawerRevenue');
  const drawerPatientPhone = document.getElementById('drawerPatientPhone');
  const drawerPocInfo = document.getElementById('drawerPocInfo');
  const drawerSaveBtn = document.getElementById('drawerSaveBtn');

  // Bulk Modal Elements
  const openBulkModalBtn = document.getElementById('openBulkModalBtn');
  const closeBulkModalBtn = document.getElementById('closeBulkModalBtn');
  const cancelBulkModalBtn = document.getElementById('cancelBulkModalBtn');
  const bulkModalBackdrop = document.getElementById('bulkModalBackdrop');
  const modalSourceUserSelect = document.getElementById('modalSourceUserSelect');
  const modalTargetUserSelect = document.getElementById('modalTargetUserSelect');
  const targetUserWrapper = document.getElementById('targetUserWrapper');
  const strategyDirectLabel = document.getElementById('strategyDirectLabel');
  const strategyRoundRobinLabel = document.getElementById('strategyRoundRobinLabel');
  const executeBulkBtn = document.getElementById('executeBulkBtn');
  const previewEligibleCount = document.getElementById('previewEligibleCount');
  const previewExcludedCount = document.getElementById('previewExcludedCount');
  const previewTargetName = document.getElementById('previewTargetName');
  const jobProgressContainer = document.getElementById('jobProgressContainer');
  const jobProgressStatusText = document.getElementById('jobProgressStatusText');
  const jobProgressPercentText = document.getElementById('jobProgressPercentText');
  const jobProgressBarFill = document.getElementById('jobProgressBarFill');
  const jobProcessedStats = document.getElementById('jobProcessedStats');

  // Revenue Split Modal Elements
  const addRevenueSplitBtn = document.getElementById('addRevenueSplitBtn');
  const revenueSplitModalBackdrop = document.getElementById('revenueSplitModalBackdrop');
  const closeRevenueModalBtn = document.getElementById('closeRevenueModalBtn');
  const cancelRevenueModalBtn = document.getElementById('cancelRevenueModalBtn');
  const saveRevenueSplitBtn = document.getElementById('saveRevenueSplitBtn');
  const revenueOrderSelect = document.getElementById('revenueOrderSelect');
  const revenueTotalAmount = document.getElementById('revenueTotalAmount');
  const splitCounselorRange = document.getElementById('splitCounselorRange');
  const splitCoachRange = document.getElementById('splitCoachRange');
  const splitPlatformRange = document.getElementById('splitPlatformRange');
  const splitCounselorPctText = document.getElementById('splitCounselorPctText');
  const splitCounselorAmtText = document.getElementById('splitCounselorAmtText');
  const splitCoachPctText = document.getElementById('splitCoachPctText');
  const splitCoachAmtText = document.getElementById('splitCoachAmtText');
  const splitPlatformPctText = document.getElementById('splitPlatformPctText');
  const splitPlatformAmtText = document.getElementById('splitPlatformAmtText');
  const splitBarCounselor = document.getElementById('splitBarCounselor');
  const splitBarCoach = document.getElementById('splitBarCoach');
  const splitBarPlatform = document.getElementById('splitBarPlatform');
  const splitTotalPctSum = document.getElementById('splitTotalPctSum');
  const splitValidationStatus = document.getElementById('splitValidationStatus');
  const splitNotesInput = document.getElementById('splitNotesInput');
  const splitCounselorName = document.getElementById('splitCounselorName');
  const splitCoachName = document.getElementById('splitCoachName');

  // Init
  initApp();

  async function initApp() {
    await fetchUsers();
    await fetchAppointments();
    setupEventListeners();
    setupRevenueSplitHandlers();
  }

  // Fetch Users
  async function fetchUsers() {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        state.users = data.data;
        populateUserDropdowns();
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }

  function populateUserDropdowns() {
    const userOptions = state.users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
    drawerAssigneeSelect.innerHTML = userOptions;
    drawerCoachSelect.innerHTML = userOptions;
    drawerPcOpsSelect.innerHTML = userOptions;

    modalSourceUserSelect.innerHTML = state.users.map(u => 
      `<option value="${u.id}">${u.name} (${u.currentActiveLoad || 0} active)</option>`
    ).join('');

    modalTargetUserSelect.innerHTML = state.users.map(u => 
      `<option value="${u.id}">${u.name} (${u.currentActiveLoad || 0} active)</option>`
    ).join('');

    if (state.users.length > 1) {
      modalTargetUserSelect.selectedIndex = 1;
    }
  }

  // Fetch Appointments
  async function fetchAppointments() {
    try {
      const params = new URLSearchParams({
        page: state.currentPage,
        limit: 20,
        type: state.activeTab,
        search: state.searchQuery,
        excludeReferral: state.excludeReferral
      });

      const res = await fetch(`/api/appointments?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        state.appointments = data.data.appointments;
        state.totalPages = data.data.pagination.totalPages || 1;
        state.totalCount = data.data.pagination.total;

        renderTable();
        updatePaginationUI(data.data.pagination);
        updateCountsUI(data.data.counts);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
  }

  function renderTable() {
    appointmentsTableBody.innerHTML = '';

    if (state.appointments.length === 0) {
      const emptyMsg = state.activeTab === 'Cancelled' 
        ? 'No cancelled appointments found in the system.' 
        : 'No appointments found matching current filters.';
      appointmentsTableBody.innerHTML = `<tr><td colspan="12" class="text-center" style="padding: 40px; color: var(--text-secondary);">${emptyMsg}</td></tr>`;
      return;
    }

    state.appointments.forEach((appt, idx) => {
      const isSelected = state.selectedIds.has(appt.id);
      const isFirst = (idx === 0 && state.currentPage === 1);
      const isCancelled = appt.status === 'CANCELLED';
      const row = document.createElement('tr');
      row.className = `${isSelected ? 'row-selected' : ''} ${isCancelled ? 'row-cancelled' : ''}`;
      if (isFirst) row.dataset.first = 'true';

      const dateObj = new Date(appt.createdAt);
      const createdFormatted = `${dateObj.getDate()} Sep, ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
      const dueObj = new Date(appt.dueDate);
      const dueFormatted = `${dueObj.getDate()} Sep ${dueObj.getFullYear()}`;

      const priorityBadge = isCancelled 
        ? `<span class="priority-badge cancelled">CANCELLED</span>`
        : `<span class="priority-badge ${appt.priority}">${appt.priority || 'medium'}</span>`;

      row.innerHTML = `
        <td class="td-checkbox" onclick="event.stopPropagation()">
          <input type="checkbox" class="row-checkbox" data-id="${appt.id}" ${isSelected ? 'checked' : ''}>
        </td>
        <td>
          <div class="assignee-cell">
            ${appt.isNew ? '<span class="new-badge-tag">New</span>' : ''}
            <div class="badge-avatar">${appt.assigneeName ? appt.assigneeName[0] : 'S'}</div>
            <span>${appt.assigneeName || 'Sonu Singh'}</span>
          </div>
        </td>
        <td>${priorityBadge}</td>
        <td>${createdFormatted}</td>
        <td>${dueFormatted}</td>
        <td><strong>${appt.orderId}</strong></td>
        <td>${appt.patientId}</td>
        <td class="text-center" onclick="event.stopPropagation()">
          <button class="call-btn-round" title="Call Patient">📞</button>
        </td>
        <td class="text-center" onclick="event.stopPropagation()">
          <button class="call-btn-round" title="Call POC">📞</button>
        </td>
        <td>${appt.contactName || '-'}</td>
        <td><strong>${appt.patientName || '-'}</strong></td>
        <td>${appt.coachName || 'Dr. S'}</td>
      `;

      // Row Click -> Open Drawer
      row.addEventListener('click', () => {
        openDetailDrawer(appt);
      });

      // Row Checkbox Click
      const chk = row.querySelector('.row-checkbox');
      chk.addEventListener('change', (e) => {
        e.stopPropagation();
        if (e.target.checked) {
          state.selectedIds.add(appt.id);
        } else {
          state.selectedIds.delete(appt.id);
        }
        updateSelectionUI();
        row.classList.toggle('row-selected', e.target.checked);
      });

      appointmentsTableBody.appendChild(row);
    });

    updateSelectAllCheckboxState();
  }

  function updatePaginationUI(pagination) {
    const from = (pagination.page - 1) * pagination.limit + 1;
    const to = Math.min(pagination.page * pagination.limit, pagination.total);
    paginationInfo.textContent = `Showing ${pagination.total > 0 ? from : 0} to ${to} of ${pagination.total} appointments`;
    pageNumDisplay.textContent = `Page ${pagination.page} of ${pagination.totalPages || 1}`;
    prevPageBtn.disabled = pagination.page <= 1;
    nextPageBtn.disabled = pagination.page >= pagination.totalPages;
  }

  function updateCountsUI(counts) {
    if (!counts) return;
    countAll.textContent = counts.all;
    countConsultation.textContent = counts.consultation;
    countDelivery.textContent = counts.delivery;
    countCancelled.textContent = counts.cancelled;
    totalApptCountBadge.textContent = `(${counts.all} Appt.)`;
  }

  function updateSelectionUI() {
    const size = state.selectedIds.size;
    if (size > 0) {
      selectionBanner.style.display = 'flex';
      selectedCountText.textContent = `${size} appointment${size > 1 ? 's' : ''} selected across table`;
      selectedBadgeNum.textContent = size;
    } else {
      selectionBanner.style.display = 'none';
    }
    updateSelectAllCheckboxState();
  }

  function updateSelectAllCheckboxState() {
    const pageIds = state.appointments.map(a => a.id);
    const allChecked = pageIds.length > 0 && pageIds.every(id => state.selectedIds.has(id));
    selectAllCheckbox.checked = allChecked;
  }

  // Open Drawer with Appointment Data
  function openDetailDrawer(appt) {
    state.selectedAppointment = appt;
    drawerOrderId.textContent = appt.orderId;

    if (appt.status === 'CANCELLED') {
      drawerStatusPill.textContent = 'CANCELLED - Patient Request / Slot Cancelled';
      drawerStatusPill.className = 'status-pill-badge cancelled';
      drawerNextStep.textContent = 'Refund / Rescheduling Review';
    } else {
      drawerStatusPill.textContent = appt.bookingStatus || 'Order confirmed from partner';
      drawerStatusPill.className = 'status-pill-badge';
      drawerNextStep.textContent = appt.nextStep || 'Upload tracking number';
    }

    drawerPriority.textContent = (appt.priority || 'Medium').toUpperCase();
    drawerPatientTitle.textContent = `${appt.patientName} / ${appt.type} / Medizen Supplements`;
    
    drawerAssigneeSelect.value = appt.assigneeId;
    drawerCoachSelect.value = appt.coachId;
    drawerPcOpsSelect.value = appt.pcOpsId || appt.assigneeId;

    const dueObj = new Date(appt.dueDate);
    drawerDueDateInput.value = `${dueObj.getDate()} Sep ${dueObj.getFullYear()}`;
    const createdObj = new Date(appt.createdAt);
    drawerCreatedDate.textContent = `${createdObj.getDate()} Sep ${createdObj.getFullYear()}`;
    drawerCreatedBy.textContent = appt.createdByName || 'Sonu Singh';

    const revenueVal = appt.revenue || 2999;
    drawerRevenue.textContent = `Edit (₹${revenueVal.toLocaleString('en-IN')})`;
    drawerRevenue.style.cursor = 'pointer';

    drawerPatientPhone.textContent = appt.contactPhone ? `${appt.contactPhone.slice(0, 2)}XXXXXX${appt.contactPhone.slice(-2)}` : '89XXXXXX78';
    drawerPocInfo.textContent = `${appt.pocName || 'ZenOnco.io Suppl Cancer Care'} | ${appt.pocPhone || '9096350273'}`;

    detailDrawer.classList.add('open');
  }

  // Save changes from Detail Drawer
  drawerSaveBtn.addEventListener('click', async () => {
    if (!state.selectedAppointment) return;
    const apptId = state.selectedAppointment.id;
    const updates = {
      assigneeId: drawerAssigneeSelect.value,
      coachId: drawerCoachSelect.value,
      pcOpsId: drawerPcOpsSelect.value
    };

    try {
      drawerSaveBtn.disabled = true;
      drawerSaveBtn.textContent = 'Saving...';
      const res = await fetch(`/api/appointments/${apptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Appointment updated successfully!', 'success');
        detailDrawer.classList.remove('open');
        fetchAppointments();
      } else {
        showToast(data.error || 'Update failed', 'error');
      }
    } catch (err) {
      showToast('Network error while updating appointment', 'error');
    } finally {
      drawerSaveBtn.disabled = false;
      drawerSaveBtn.textContent = 'Update';
    }
  });

  // ==========================================
  // REVENUE SPLIT MODAL LOGIC
  // ==========================================
  function openRevenueSplitModal(targetAppt = null) {
    const appt = targetAppt || state.selectedAppointment || state.appointments[0];
    if (!appt) {
      showToast('Please select an appointment first to configure revenue split.', 'error');
      return;
    }

    // Populate Order Select Dropdown with active appointments
    revenueOrderSelect.innerHTML = state.appointments.map(a => 
      `<option value="${a.id}" ${a.id === appt.id ? 'selected' : ''}>Order #${a.orderId} - ${a.patientName} (₹${a.revenue || 2999})</option>`
    ).join('');

    revenueTotalAmount.value = appt.revenue || 2999;
    splitCounselorName.textContent = `${appt.assigneeName || 'Sonu Singh'} (Counselor)`;
    splitCoachName.textContent = `${appt.coachName || 'Dr. S. Sharma'} (Coach / Doctor)`;

    // Check if appointment already has split
    if (appt.revenueSplit) {
      splitCounselorRange.value = appt.revenueSplit.counselorSharePct || 40;
      splitCoachRange.value = appt.revenueSplit.coachSharePct || 40;
      splitPlatformRange.value = appt.revenueSplit.platformSharePct || 20;
      splitNotesInput.value = appt.revenueSplit.notes || '';
    } else {
      splitCounselorRange.value = 40;
      splitCoachRange.value = 40;
      splitPlatformRange.value = 20;
      splitNotesInput.value = 'Standard 40-40-20 Onco Care Consultation Agreement';
    }

    recalculateRevenueSplit();
    revenueSplitModalBackdrop.classList.add('open');
  }

  function recalculateRevenueSplit() {
    const total = parseFloat(revenueTotalAmount.value) || 0;
    const cPct = parseInt(splitCounselorRange.value) || 0;
    const dPct = parseInt(splitCoachRange.value) || 0;
    const pPct = parseInt(splitPlatformRange.value) || 0;

    const totalPct = cPct + dPct + pPct;

    const cAmt = Math.round((total * cPct) / 100);
    const dAmt = Math.round((total * dPct) / 100);
    const pAmt = Math.round((total * pPct) / 100);

    splitCounselorPctText.textContent = `${cPct}%`;
    splitCounselorAmtText.textContent = `₹${cAmt.toLocaleString('en-IN')}`;

    splitCoachPctText.textContent = `${dPct}%`;
    splitCoachAmtText.textContent = `₹${dAmt.toLocaleString('en-IN')}`;

    splitPlatformPctText.textContent = `${pPct}%`;
    splitPlatformAmtText.textContent = `₹${pAmt.toLocaleString('en-IN')}`;

    // Bar visual
    splitBarCounselor.style.width = `${cPct}%`;
    splitBarCoach.style.width = `${dPct}%`;
    splitBarPlatform.style.width = `${pPct}%`;

    splitTotalPctSum.textContent = `${totalPct}%`;

    if (totalPct === 100) {
      splitValidationStatus.textContent = `✓ Total matches 100% (₹${total.toLocaleString('en-IN')})`;
      splitValidationStatus.className = 'text-success';
      saveRevenueSplitBtn.disabled = false;
    } else {
      splitValidationStatus.textContent = `⚠️ Total is ${totalPct}% (Must equal 100%)`;
      splitValidationStatus.className = 'text-warning';
      saveRevenueSplitBtn.disabled = true;
    }
  }

  function setupRevenueSplitHandlers() {
    addRevenueSplitBtn.addEventListener('click', () => {
      openRevenueSplitModal();
    });

    drawerRevenue.addEventListener('click', () => {
      openRevenueSplitModal(state.selectedAppointment);
    });

    closeRevenueModalBtn.addEventListener('click', () => {
      revenueSplitModalBackdrop.classList.remove('open');
    });

    cancelRevenueModalBtn.addEventListener('click', () => {
      revenueSplitModalBackdrop.classList.remove('open');
    });

    revenueOrderSelect.addEventListener('change', (e) => {
      const found = state.appointments.find(a => a.id === e.target.value);
      if (found) {
        revenueTotalAmount.value = found.revenue || 2999;
        splitCounselorName.textContent = `${found.assigneeName || 'Sonu Singh'} (Counselor)`;
        splitCoachName.textContent = `${found.coachName || 'Dr. S. Sharma'} (Coach / Doctor)`;
        recalculateRevenueSplit();
      }
    });

    revenueTotalAmount.addEventListener('input', recalculateRevenueSplit);
    splitCounselorRange.addEventListener('input', recalculateRevenueSplit);
    splitCoachRange.addEventListener('input', recalculateRevenueSplit);
    splitPlatformRange.addEventListener('input', recalculateRevenueSplit);

    // Preset Buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        splitCounselorRange.value = btn.dataset.counselor;
        splitCoachRange.value = btn.dataset.coach;
        splitPlatformRange.value = btn.dataset.platform;
        recalculateRevenueSplit();
      });
    });

    // Save Revenue Split
    saveRevenueSplitBtn.addEventListener('click', async () => {
      const apptId = revenueOrderSelect.value;
      const totalAmount = parseFloat(revenueTotalAmount.value) || 2999;
      const cPct = parseInt(splitCounselorRange.value) || 0;
      const dPct = parseInt(splitCoachRange.value) || 0;
      const pPct = parseInt(splitPlatformRange.value) || 0;

      const payload = {
        totalAmount,
        counselorSharePct: cPct,
        counselorShareAmt: Math.round((totalAmount * cPct) / 100),
        coachSharePct: dPct,
        coachShareAmt: Math.round((totalAmount * dPct) / 100),
        platformSharePct: pPct,
        platformShareAmt: Math.round((totalAmount * pPct) / 100),
        notes: splitNotesInput.value.trim() || 'Revenue split configured'
      };

      try {
        saveRevenueSplitBtn.disabled = true;
        saveRevenueSplitBtn.textContent = 'Saving Split...';
        const res = await fetch(`/api/appointments/${apptId}/revenue-split`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Revenue split saved: ₹${payload.counselorShareAmt} Counselor / ₹${payload.coachShareAmt} Doctor / ₹${payload.platformShareAmt} Platform`, 'success');
          revenueSplitModalBackdrop.classList.remove('open');
          fetchAppointments();
        } else {
          showToast(data.error || 'Failed to save revenue split', 'error');
        }
      } catch (err) {
        showToast('Error saving revenue split', 'error');
      } finally {
        saveRevenueSplitBtn.disabled = false;
        saveRevenueSplitBtn.textContent = 'Save & Apply Revenue Split';
      }
    });
  }

  // ==========================================
  // BULK REASSIGNMENT MODAL & PREVIEW
  // ==========================================
  openBulkModalBtn.addEventListener('click', () => {
    openBulkModal();
  });

  reassignSelectedBtn.addEventListener('click', () => {
    openBulkModal(Array.from(state.selectedIds));
  });

  function openBulkModal(selectedIds = null) {
    jobProgressContainer.style.display = 'none';
    executeBulkBtn.disabled = false;
    executeBulkBtn.textContent = 'Confirm & Execute Reassignment';
    bulkModalBackdrop.classList.add('open');
    refreshImpactPreview(selectedIds);
  }

  async function refreshImpactPreview(selectedIds = null) {
    const sourceUserId = modalSourceUserSelect.value;
    const isDirect = strategyDirectLabel.querySelector('input').checked;
    const targetUserId = isDirect ? modalTargetUserSelect.value : null;

    try {
      const res = await fetch('/api/bulk/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceUserId,
          targetUserId,
          filters: {
            excludeActiveCalls: document.getElementById('modalExcludeActiveCalls').checked,
            statuses: document.getElementById('modalOnlyPendingConfirmed').checked ? ['CONFIRMED', 'PENDING'] : [],
            selectedAppointmentIds: selectedIds
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        previewEligibleCount.textContent = data.data.totalEligible;
        previewExcludedCount.textContent = data.data.activeCallsExcluded;
        const targetUserObj = state.users.find(u => u.id === targetUserId);
        previewTargetName.textContent = isDirect ? (targetUserObj ? targetUserObj.name : 'Target Counselor') : 'Team (Round-Robin)';
      }
    } catch (err) {
      console.error('Failed to get preview:', err);
    }
  }

  // Execute Bulk Reassign
  executeBulkBtn.addEventListener('click', async () => {
    const sourceUserId = modalSourceUserSelect.value;
    const isDirect = strategyDirectLabel.querySelector('input').checked;
    const targetUserId = isDirect ? modalTargetUserSelect.value : null;
    const distributionStrategy = isDirect ? 'DIRECT' : 'ROUND_ROBIN';

    const fieldsToReassign = [];
    if (document.getElementById('fieldAssignee').checked) fieldsToReassign.push('assignee');
    if (document.getElementById('fieldCoach').checked) fieldsToReassign.push('coach');
    if (document.getElementById('fieldPcOps').checked) fieldsToReassign.push('pcOps');

    const payload = {
      sourceUserId,
      targetUserId,
      distributionStrategy,
      fieldsToReassign,
      reason: document.getElementById('modalReassignReason').value || 'Department transfer / reassignment',
      filters: {
        excludeActiveCalls: document.getElementById('modalExcludeActiveCalls').checked,
        statuses: document.getElementById('modalOnlyPendingConfirmed').checked ? ['CONFIRMED', 'PENDING'] : [],
        selectedAppointmentIds: state.selectedIds.size > 0 ? Array.from(state.selectedIds) : undefined
      }
    };

    try {
      executeBulkBtn.disabled = true;
      executeBulkBtn.textContent = 'Initiating Job...';
      jobProgressContainer.style.display = 'block';
      jobProgressBarFill.style.width = '0%';
      jobProgressPercentText.textContent = '0%';

      const res = await fetch('/api/bulk/reassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        state.activeJobId = data.data.jobId;
        showToast(data.message, 'success');
      } else {
        showToast(data.error || 'Failed to initiate bulk reassignment', 'error');
        executeBulkBtn.disabled = false;
        executeBulkBtn.textContent = 'Confirm & Execute Reassignment';
      }
    } catch (err) {
      showToast('Error executing bulk reassignment', 'error');
      executeBulkBtn.disabled = false;
    }
  });

  function updateJobProgressUI(job) {
    if (job.jobId !== state.activeJobId && state.activeJobId) return;

    jobProgressContainer.style.display = 'block';
    const pct = job.percent || 0;
    jobProgressBarFill.style.width = `${pct}%`;
    jobProgressPercentText.textContent = `${pct}%`;
    jobProcessedStats.textContent = `${job.processedCount} / ${job.totalCount} processed`;

    if (job.status === 'COMPLETED') {
      jobProgressStatusText.textContent = '✅ Batch Reassignment Completed Successfully!';
      executeBulkBtn.textContent = 'Close';
      executeBulkBtn.disabled = false;
      executeBulkBtn.onclick = () => {
        bulkModalBackdrop.classList.remove('open');
        state.selectedIds.clear();
        updateSelectionUI();
        fetchAppointments();
      };
      showToast(`Batch completed: ${job.processedCount} appointments reassigned!`, 'success');
    } else if (job.status === 'FAILED') {
      jobProgressStatusText.textContent = '❌ Batch Reassignment Encountered an Error';
      executeBulkBtn.disabled = false;
    }
  }

  // Event Listeners
  function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeTab = btn.dataset.tab;
        state.currentPage = 1;
        fetchAppointments();
      });
    });

    // Search input with debounce
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        state.searchQuery = e.target.value.trim();
        state.currentPage = 1;
        fetchAppointments();
      }, 300);
    });

    // Exclude referral checkbox
    excludeReferralCheckbox.addEventListener('change', (e) => {
      state.excludeReferral = e.target.checked;
      state.currentPage = 1;
      fetchAppointments();
    });

    // Select all on page
    selectAllCheckbox.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      state.appointments.forEach(a => {
        if (isChecked) {
          state.selectedIds.add(a.id);
        } else {
          state.selectedIds.delete(a.id);
        }
      });
      renderTable();
      updateSelectionUI();
    });

    // Clear selection
    clearSelectionBtn.addEventListener('click', () => {
      state.selectedIds.clear();
      renderTable();
      updateSelectionUI();
    });

    // Pagination
    prevPageBtn.addEventListener('click', () => {
      if (state.currentPage > 1) {
        state.currentPage--;
        fetchAppointments();
      }
    });

    nextPageBtn.addEventListener('click', () => {
      if (state.currentPage < state.totalPages) {
        state.currentPage++;
        fetchAppointments();
      }
    });

    // Drawer close
    closeDrawerBtn.addEventListener('click', () => {
      detailDrawer.classList.remove('open');
    });

    // Modal Close
    closeBulkModalBtn.addEventListener('click', () => bulkModalBackdrop.classList.remove('open'));
    cancelBulkModalBtn.addEventListener('click', () => bulkModalBackdrop.classList.remove('open'));

    // Strategy toggles
    strategyDirectLabel.addEventListener('click', () => {
      strategyDirectLabel.classList.add('active');
      strategyRoundRobinLabel.classList.remove('active');
      targetUserWrapper.style.display = 'block';
      refreshImpactPreview();
    });

    strategyRoundRobinLabel.addEventListener('click', () => {
      strategyRoundRobinLabel.classList.add('active');
      strategyDirectLabel.classList.remove('active');
      targetUserWrapper.style.display = 'none';
      refreshImpactPreview();
    });

    modalSourceUserSelect.addEventListener('change', () => refreshImpactPreview());
    modalTargetUserSelect.addEventListener('change', () => refreshImpactPreview());
    document.getElementById('modalExcludeActiveCalls').addEventListener('change', () => refreshImpactPreview());
    document.getElementById('modalOnlyPendingConfirmed').addEventListener('change', () => refreshImpactPreview());
  }

  // Toast notification helper
  function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✓' : '⚠️'}</span>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 4000);
  }
});
