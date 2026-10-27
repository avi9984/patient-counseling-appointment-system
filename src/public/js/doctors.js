document.addEventListener('DOMContentLoaded', () => {
  let doctorsList = [];
  let topReferrersList = [];
  let selectedDoctor = null;

  // DOM Elements
  const doctorsTableBody = document.getElementById('doctorsTableBody');
  const topReferrersGrid = document.getElementById('topReferrersGrid');
  const doctorSearchInput = document.getElementById('doctorSearchInput');
  const statusFilterSelect = document.getElementById('statusFilterSelect');
  const cityFilterSelect = document.getElementById('cityFilterSelect');

  // Metrics Elements
  const statTotalDoctors = document.getElementById('statTotalDoctors');
  const statActiveDoctors = document.getElementById('statActiveDoctors');
  const statTotalReferrals = document.getElementById('statTotalReferrals');
  const statCitiesCovered = document.getElementById('statCitiesCovered');

  // Edit Modal Elements
  const editDoctorModalBackdrop = document.getElementById('editDoctorModalBackdrop');
  const closeEditDoctorModalBtn = document.getElementById('closeEditDoctorModalBtn');
  const cancelEditDoctorBtn = document.getElementById('cancelEditDoctorBtn');
  const saveDoctorChangesBtn = document.getElementById('saveDoctorChangesBtn');
  const editDoctorId = document.getElementById('editDoctorId');
  const editDoctorName = document.getElementById('editDoctorName');
  const editDoctorSpecialization = document.getElementById('editDoctorSpecialization');
  const editDoctorMobile = document.getElementById('editDoctorMobile');
  const editDoctorEmail = document.getElementById('editDoctorEmail');
  const editDoctorHospital = document.getElementById('editDoctorHospital');
  const editDoctorExperience = document.getElementById('editDoctorExperience');
  const editDoctorCity = document.getElementById('editDoctorCity');
  const editDoctorStatus = document.getElementById('editDoctorStatus');

  // View Drawer Elements
  const doctorViewDrawer = document.getElementById('doctorViewDrawer');
  const closeDoctorViewDrawerBtn = document.getElementById('closeDoctorViewDrawerBtn');
  const drawerDocAvatar = document.getElementById('drawerDocAvatar');
  const drawerDocName = document.getElementById('drawerDocName');
  const drawerDocCode = document.getElementById('drawerDocCode');
  const drawerDocStatus = document.getElementById('drawerDocStatus');
  const drawerDocRating = document.getElementById('drawerDocRating');
  const drawerDocTotalReferred = document.getElementById('drawerDocTotalReferred');
  const drawerDocActivePatients = document.getElementById('drawerDocActivePatients');
  const drawerDocConsultations = document.getElementById('drawerDocConsultations');
  const drawerDocSpec = document.getElementById('drawerDocSpec');
  const drawerDocHospital = document.getElementById('drawerDocHospital');
  const drawerDocMobile = document.getElementById('drawerDocMobile');
  const drawerDocEmail = document.getElementById('drawerDocEmail');
  const drawerDocExp = document.getElementById('drawerDocExp');
  const drawerDocReferralCode = document.getElementById('drawerDocReferralCode');
  const drawerEditBtn = document.getElementById('drawerEditBtn');

  init();

  async function init() {
    await fetchDoctorsData();
    setupEventListeners();
  }

  async function fetchDoctorsData() {
    const search = doctorSearchInput.value.trim();
    const status = statusFilterSelect.value;
    const city = cityFilterSelect.value;

    const params = new URLSearchParams({ search, status, city });

    try {
      const res = await fetch(`/api/doctors?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        doctorsList = data.data.doctors;
        topReferrersList = data.data.topReferrers;
        renderMetrics(data.data.stats);
        renderTopReferrers(topReferrersList);
        renderDoctorsTable(doctorsList);
      }
    } catch (err) {
      console.error('Error loading doctors data:', err);
    }
  }

  function renderMetrics(stats) {
    if (!stats) return;
    statTotalDoctors.textContent = stats.totalDoctors;
    statActiveDoctors.textContent = stats.activeDoctors;
    statTotalReferrals.textContent = stats.totalReferrals;
    statCitiesCovered.textContent = stats.citiesCount;
  }

  function renderTopReferrers(referrers) {
    topReferrersGrid.innerHTML = '';
    referrers.forEach((ref, idx) => {
      const card = document.createElement('div');
      card.className = 'referrer-card-item';
      card.innerHTML = `
        <span class="rank-badge rank-${ref.rank}">#${ref.rank}</span>
        <div class="ref-avatar">${ref.avatar || ref.name.slice(0, 2).toUpperCase()}</div>
        <div class="ref-info">
          <strong>${ref.name}</strong>
          <span>${ref.code} • ${ref.city}</span>
          <div class="ref-count">🩺 ${ref.doctorsReferred} Doctor${ref.doctorsReferred > 1 ? 's' : ''} Referred</div>
        </div>
      `;
      topReferrersGrid.appendChild(card);
    });
  }

  function renderDoctorsTable(doctors) {
    doctorsTableBody.innerHTML = '';
    if (doctors.length === 0) {
      doctorsTableBody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 30px;">No doctors found matching filters.</td></tr>`;
      return;
    }

    doctors.forEach(doc => {
      const tr = document.createElement('tr');
      const initials = doc.name.replace('Dr. ', '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

      tr.innerHTML = `
        <td>
          <div class="doctor-profile-cell">
            <div class="doc-circle-avatar">${initials}</div>
            <div>
              <strong>${doc.name}</strong>
              <span>${doc.specialization || 'Oncologist'}</span>
            </div>
          </div>
        </td>
        <td><span class="code-pill">${doc.code || 'ZH102934'}</span></td>
        <td>
          <strong>+91 ${doc.mobile}</strong>
          <div style="font-size: 11px; color: var(--text-secondary);">${doc.email || '-'}</div>
        </td>
        <td>
          <strong>${doc.hospital || 'ZenOnco Partner Clinic'}</strong>
          <div style="font-size: 11px; color: var(--text-secondary);">📍 ${doc.city}</div>
        </td>
        <td>
          <strong style="color: #2563eb; font-size: 14px;">${doc.patientsReferred || 0}</strong> patients
          <div style="font-size: 11px; color: #059669;">⭐ ${doc.rating || '4.8'} rating</div>
        </td>
        <td>
          <span class="status-badge ${doc.status}">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: ${doc.status === 'active' ? '#10b981' : '#94a3b8'};"></span>
            ${doc.status}
          </span>
        </td>
        <td class="text-right">
          <div class="action-btn-group">
            <button class="btn-icon-action view-btn" title="View Full Profile">👁 View</button>
            <button class="btn-icon-action edit-btn" title="Edit Doctor Details">✏️ Edit</button>
            <button class="btn-icon-action toggle-btn" title="Toggle Status">${doc.status === 'active' ? '⏸ Deactivate' : '▶ Activate'}</button>
          </div>
        </td>
      `;

      // Event handlers
      tr.querySelector('.view-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openViewDrawer(doc);
      });

      tr.querySelector('.edit-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(doc);
      });

      tr.querySelector('.toggle-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        await toggleDoctorStatus(doc.id);
      });

      tr.addEventListener('click', () => {
        openViewDrawer(doc);
      });

      doctorsTableBody.appendChild(tr);
    });
  }

  function openViewDrawer(doc) {
    selectedDoctor = doc;
    const initials = doc.name.replace('Dr. ', '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    drawerDocAvatar.textContent = initials;
    drawerDocName.textContent = doc.name;
    drawerDocCode.textContent = `Code: ${doc.code} • ${doc.city}`;
    drawerDocStatus.textContent = `${doc.status.toUpperCase()} PARTNER`;
    drawerDocRating.textContent = `⭐ ${doc.rating || '4.9'} / 5.0`;

    drawerDocTotalReferred.textContent = doc.patientsReferred || 0;
    drawerDocActivePatients.textContent = doc.activePatients || Math.floor((doc.patientsReferred || 0) * 0.4);
    drawerDocConsultations.textContent = doc.totalConsultations || (doc.patientsReferred || 0) * 3;

    drawerDocSpec.textContent = doc.specialization || 'Oncologist';
    drawerDocHospital.textContent = doc.hospital || 'ZenOnco Partner Clinic';
    drawerDocMobile.textContent = `+91 ${doc.mobile}`;
    drawerDocEmail.textContent = doc.email || `${doc.name.toLowerCase().replace(/\s+/g, '.')}@zenonco.io`;
    drawerDocExp.textContent = doc.experience || '8 years';
    drawerDocReferralCode.textContent = doc.referralCode || doc.code;

    doctorViewDrawer.classList.add('open');
  }

  function openEditModal(doc) {
    selectedDoctor = doc;
    editDoctorId.value = doc.id;
    editDoctorName.value = doc.name;
    editDoctorSpecialization.value = doc.specialization || '';
    editDoctorMobile.value = doc.mobile;
    editDoctorEmail.value = doc.email || '';
    editDoctorHospital.value = doc.hospital || '';
    editDoctorExperience.value = doc.experience || '';
    editDoctorCity.value = doc.city;
    editDoctorStatus.value = doc.status || 'active';

    editDoctorModalBackdrop.classList.add('open');
  }

  saveDoctorChangesBtn.addEventListener('click', async () => {
    const id = editDoctorId.value;
    const payload = {
      name: editDoctorName.value.trim(),
      specialization: editDoctorSpecialization.value.trim(),
      mobile: editDoctorMobile.value.trim(),
      email: editDoctorEmail.value.trim(),
      hospital: editDoctorHospital.value.trim(),
      experience: editDoctorExperience.value.trim(),
      city: editDoctorCity.value.trim(),
      status: editDoctorStatus.value
    };

    try {
      saveDoctorChangesBtn.disabled = true;
      saveDoctorChangesBtn.textContent = 'Saving...';
      const res = await fetch(`/api/doctors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Doctor profile updated successfully!', 'success');
        editDoctorModalBackdrop.classList.remove('open');
        if (doctorViewDrawer.classList.contains('open')) {
          openViewDrawer(data.data);
        }
        fetchDoctorsData();
      } else {
        showToast(data.error || 'Failed to update doctor', 'error');
      }
    } catch (err) {
      showToast('Network error while saving doctor', 'error');
    } finally {
      saveDoctorChangesBtn.disabled = false;
      saveDoctorChangesBtn.textContent = 'Save Changes';
    }
  });

  async function toggleDoctorStatus(id) {
    try {
      const res = await fetch(`/api/doctors/${id}/toggle-status`, {
        method: 'PATCH'
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchDoctorsData();
      }
    } catch (err) {
      showToast('Failed to toggle status', 'error');
    }
  }

  function setupEventListeners() {
    let timeout;
    doctorSearchInput.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(fetchDoctorsData, 300);
    });

    statusFilterSelect.addEventListener('change', fetchDoctorsData);
    cityFilterSelect.addEventListener('change', fetchDoctorsData);

    closeDoctorViewDrawerBtn.addEventListener('click', () => doctorViewDrawer.classList.remove('open'));
    closeEditDoctorModalBtn.addEventListener('click', () => editDoctorModalBackdrop.classList.remove('open'));
    cancelEditDoctorBtn.addEventListener('click', () => editDoctorModalBackdrop.classList.remove('open'));

    drawerEditBtn.addEventListener('click', () => {
      if (selectedDoctor) openEditModal(selectedDoctor);
    });
  }

  function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✓' : '⚠️'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }
});
