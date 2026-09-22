// Nagarathnamma Cash Bill App Engine
// Full offline-first + Supabase real-time sync for Mobile and PC

const DEFAULT_SUPABASE_URL = "https://ifxjekxawcnczezyjkrd.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_hiKKIwgv7aT3jpgfJaby0w_B7_la-ZC";

const state = {
  supabaseUrl: localStorage.getItem("supabase_url") || DEFAULT_SUPABASE_URL,
  supabaseKey: localStorage.getItem("supabase_key") || DEFAULT_SUPABASE_KEY,
  supabaseClient: null,
  syncStatus: "offline", // "connected", "syncing", "offline", "error"
  bills: [],
  currentTab: "new_bill", // "new_bill", "history", "settings", "preview"
  activeBill: null,
  isEditing: false,
  searchTerm: "",
  settings: {
    company_name: "Nagarathnamma",
    tagline: "SCREEN & OFFSET PRINTING",
    phone: "",
    address: "# 72, 4th Cross Road, Vidyaranyapura, Bengaluru – 560 097.",
    bank_name: "IDBI Bank",
    account_name: "K N NAGARATHNAMMA",
    account_no: "0363104000056179",
    branch: "R.T. Nagar",
    ifsc_code: "IBKL0000363",
  },
  formData: {
    bill_no: "",
    bill_date: new Date().toISOString().split("T")[0],
    customer_name: "",
    customer_phone: "",
    customer_address: "",
    items: [
      { particulars: "", qty: 1, rate: 0, amount: 0 },
      { particulars: "", qty: "", rate: "", amount: 0 },
      { particulars: "", qty: "", rate: "", amount: 0 },
    ],
    advance: 0,
    notes: ""
  }
};

// --- NUMBER TO WORDS (INDIAN RUPEE SYSTEM) ---
function numberToWords(num) {
  if (num === null || num === undefined || isNaN(num) || num <= 0) return "Zero Rupees Only";
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(n) {
    let str = "";
    if (n > 99) {
      str += a[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + " " + a[n % 10];
    } else if (n > 0) {
      str += a[n];
    }
    return str.trim();
  }

  const parts = Number(num).toFixed(2).split(".");
  let whole = parseInt(parts[0], 10);
  let decimal = parseInt(parts[1], 10);

  let output = "";
  if (whole >= 10000000) {
    output += inWords(Math.floor(whole / 10000000)) + " Crore ";
    whole %= 10000000;
  }
  if (whole >= 100000) {
    output += inWords(Math.floor(whole / 100000)) + " Lakh ";
    whole %= 100000;
  }
  if (whole >= 1000) {
    output += inWords(Math.floor(whole / 1000)) + " Thousand ";
    whole %= 1000;
  }
  if (whole > 0) {
    output += inWords(whole) + " ";
  }

  output = output.trim() + " Rupees";

  if (decimal > 0) {
    output += " and " + inWords(decimal) + " Paise";
  }

  return output + " Only";
}

// --- INITIALIZE SUPABASE ---
function initSupabase() {
  if (state.supabaseUrl && state.supabaseKey && window.supabase) {
    try {
      state.supabaseClient = window.supabase.createClient(state.supabaseUrl, state.supabaseKey);
      state.syncStatus = "connected";
      loadBillsFromCloud();
      subscribeRealtime();
    } catch (e) {
      console.error("Supabase init error:", e);
      state.syncStatus = "error";
    }
  } else {
    state.syncStatus = "offline";
  }
}

// --- LOCAL STORAGE CACHE ---
function loadFromLocal() {
  const cached = localStorage.getItem("nagarathnamma_bills");
  if (cached) {
    try {
      state.bills = JSON.parse(cached);
    } catch (e) {
      state.bills = [];
    }
  }
  const cachedSettings = localStorage.getItem("nagarathnamma_settings");
  if (cachedSettings) {
    try {
      state.settings = { ...state.settings, ...JSON.parse(cachedSettings) };
    } catch (e) {}
  }
}

function saveToLocal() {
  localStorage.setItem("nagarathnamma_bills", JSON.stringify(state.bills));
  localStorage.setItem("nagarathnamma_settings", JSON.stringify(state.settings));
}

// --- CLOUD SYNC ---
async function loadBillsFromCloud() {
  if (!state.supabaseClient) return;
  state.syncStatus = "syncing";
  render();
  try {
    const { data, error } = await state.supabaseClient
      .from("bills")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (data) {
      state.bills = data;
      saveToLocal();
      state.syncStatus = "connected";
    }
  } catch (err) {
    console.error("Failed to load bills from Supabase:", err);
    state.syncStatus = "error";
  }
  render();
}

function subscribeRealtime() {
  if (!state.supabaseClient) return;
  state.supabaseClient
    .channel("public:bills")
    .on("postgres_changes", { event: "*", schema: "public", table: "bills" }, (payload) => {
      console.log("Realtime change received:", payload);
      if (payload.eventType === "INSERT") {
        const exists = state.bills.some(b => b.id === payload.new.id);
        if (!exists) state.bills.unshift(payload.new);
      } else if (payload.eventType === "UPDATE") {
        state.bills = state.bills.map(b => b.id === payload.new.id ? payload.new : b);
      } else if (payload.eventType === "DELETE") {
        state.bills = state.bills.filter(b => b.id === payload.old.id);
      }
      saveToLocal();
      render();
    })
    .subscribe();
}

// --- CALCULATIONS ---
function calculateTotals(items, advance = 0) {
  let subtotal = 0;
  items.forEach(item => {
    const q = parseFloat(item.qty) || 0;
    const r = parseFloat(item.rate) || 0;
    const lineTotal = Math.round((q * r) * 100) / 100;
    item.amount = lineTotal;
    subtotal += lineTotal;
  });
  const adv = parseFloat(advance) || 0;
  const totalAmount = Math.max(0, subtotal - adv);
  return {
    subtotal: subtotal.toFixed(2),
    advance: adv.toFixed(2),
    totalAmount: totalAmount.toFixed(2),
    amountInWords: numberToWords(totalAmount)
  };
}

function getNextBillNo() {
  if (state.bills.length === 0) return 1;
  const numbers = state.bills
    .map(b => parseInt(b.custom_bill_no || b.bill_no, 10))
    .filter(n => !isNaN(n));
  return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
}

// --- ACTIONS ---
async function handleSaveBill(e, saveAction = 'preview') {
  if (e) e.preventDefault();
  const validItems = state.formData.items.filter(i => i.particulars && i.particulars.trim() !== "");
  if (validItems.length === 0) {
    alert("Please enter at least one item particulars.");
    return;
  }
  if (!state.formData.customer_name.trim()) {
    alert("Please enter Customer Name (M/s).");
    return;
  }

  const totals = calculateTotals(validItems, state.formData.advance);
  const billRecord = {
    id: state.isEditing && state.activeBill ? state.activeBill.id : crypto.randomUUID(),
    custom_bill_no: state.formData.bill_no || String(getNextBillNo()),
    bill_date: state.formData.bill_date,
    customer_name: state.formData.customer_name,
    customer_phone: state.formData.customer_phone || "",
    customer_address: state.formData.customer_address || "",
    items: validItems,
    subtotal: totals.subtotal,
    advance: totals.advance,
    total_amount: totals.totalAmount,
    amount_in_words: totals.amountInWords,
    notes: state.formData.notes || "",
    updated_at: new Date().toISOString()
  };

  // 1. Update local state immediately (offline-first)
  if (state.isEditing) {
    state.bills = state.bills.map(b => b.id === billRecord.id ? billRecord : b);
  } else {
    billRecord.created_at = new Date().toISOString();
    state.bills.unshift(billRecord);
  }
  saveToLocal();

  // 2. Sync to Supabase if connected
  if (state.supabaseClient) {
    try {
      const { error } = await state.supabaseClient
        .from("bills")
        .upsert(billRecord);
      if (error) console.error("Cloud save failed, saved locally:", error);
    } catch (err) {
      console.warn("Failed to sync bill directly:", err);
    }
  }

  state.activeBill = billRecord;

  if (saveAction === 'print') {
    state.currentTab = "preview";
    render();
    setTimeout(() => {
      printCurrentBill();
    }, 150);
  } else if (saveAction === 'new') {
    resetForm();
    state.currentTab = "new_bill";
    render();
    alert(`Bill #${billRecord.custom_bill_no} saved successfully! Ready for new bill.`);
  } else if (saveAction === 'history') {
    resetForm();
    state.currentTab = "history";
    render();
  } else {
    // Default preview
    state.currentTab = "preview";
    render();
  }
}

function resetForm() {
  state.isEditing = false;
  state.formData = {
    bill_no: String(getNextBillNo()),
    bill_date: new Date().toISOString().split("T")[0],
    customer_name: "",
    customer_phone: "",
    customer_address: "",
    items: [
      { particulars: "", qty: 1, rate: "", amount: 0 },
      { particulars: "", qty: "", rate: "", amount: 0 },
      { particulars: "", qty: "", rate: "", amount: 0 },
      { particulars: "", qty: "", rate: "", amount: 0 },
    ],
    advance: 0,
    notes: ""
  };
}

function editBill(bill) {
  state.activeBill = bill;
  state.isEditing = true;
  state.formData = {
    bill_no: bill.custom_bill_no || bill.bill_no,
    bill_date: bill.bill_date,
    customer_name: bill.customer_name,
    customer_phone: bill.customer_phone || "",
    customer_address: bill.customer_address || "",
    items: bill.items && bill.items.length > 0 ? JSON.parse(JSON.stringify(bill.items)) : [{ particulars: "", qty: 1, rate: 0, amount: 0 }],
    advance: bill.advance || 0,
    notes: bill.notes || ""
  };
  state.currentTab = "new_bill";
  render();
}

async function deleteBill(billId) {
  if (!confirm("Are you sure you want to delete this bill?")) return;
  state.bills = state.bills.filter(b => b.id !== billId);
  saveToLocal();
  if (state.supabaseClient) {
    await state.supabaseClient.from("bills").delete().eq("id", billId);
  }
  if (state.activeBill && state.activeBill.id === billId) {
    state.activeBill = null;
    state.currentTab = "history";
  }
  render();
}

function shareViaWhatsApp(bill) {
  const phone = (bill.customer_phone || "").replace(/\D/g, "");
  const text = `*CASH BILL - Nagarathnamma Screen & Offset Printing*%0A` +
    `*Bill No:* ${bill.custom_bill_no || bill.bill_no}%0A` +
    `*Date:* ${bill.bill_date}%0A` +
    `*Customer:* ${bill.customer_name}%0A%0A` +
    `*Items:*%0A` +
    bill.items.map(i => `• ${i.particulars} (${i.qty} x ₹${i.rate}) = ₹${i.amount}`).join("%0A") +
    `%0A%0A*Total:* ₹${bill.subtotal}` +
    (parseFloat(bill.advance) > 0 ? `%0A*Advance Paid:* ₹${bill.advance}` : "") +
    `%0A*Balance / Total Amount:* ₹${bill.total_amount}%0A%0A` +
    `*Bank Details:*%0A${state.settings.bank_name}, A/c: ${state.settings.account_no}%0AIFSC: ${state.settings.ifsc_code} (${state.settings.branch})%0A%0AThank you for your business!`;

  const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
  window.open(url, "_blank");
}

// --- RENDER VIEWS ---
function render() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <!-- Top Navigation Bar -->
    <header class="bg-slate-900 text-white shadow-lg sticky top-0 z-30 no-print">
      <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="bg-amber-400 text-slate-950 font-black px-2.5 py-1 rounded text-lg font-brand tracking-wider">
            N
          </div>
          <div>
            <h1 class="font-bold text-base md:text-lg leading-tight">Nagarathnamma</h1>
            <p class="text-xs text-slate-300 hidden sm:block">Screen & Offset Printing Cash Bill</p>
          </div>
        </div>

        <!-- Sync Indicator -->
        <div class="flex items-center space-x-2 text-xs">
          ${renderSyncBadge()}
        </div>

        <!-- Navigation Tabs -->
        <nav class="flex space-x-1 sm:space-x-2">
          <button onclick="switchTab('new_bill')" class="px-3 py-1.5 rounded-lg font-medium text-xs sm:text-sm transition flex items-center gap-1.5 ${state.currentTab === 'new_bill' ? 'bg-amber-400 text-slate-950 font-semibold' : 'text-slate-200 hover:bg-slate-800'}">
            <i data-lucide="plus-circle" class="w-4 h-4"></i>
            <span>${state.isEditing ? 'Edit Bill' : 'New Bill'}</span>
          </button>
          <button onclick="switchTab('history')" class="px-3 py-1.5 rounded-lg font-medium text-xs sm:text-sm transition flex items-center gap-1.5 ${state.currentTab === 'history' ? 'bg-amber-400 text-slate-950 font-semibold' : 'text-slate-200 hover:bg-slate-800'}">
            <i data-lucide="history" class="w-4 h-4"></i>
            <span>Bills (${state.bills.length})</span>
          </button>
          <button onclick="switchTab('settings')" class="px-2.5 py-1.5 rounded-lg font-medium text-xs sm:text-sm transition flex items-center gap-1 ${state.currentTab === 'settings' ? 'bg-amber-400 text-slate-950' : 'text-slate-200 hover:bg-slate-800'}">
            <i data-lucide="settings" class="w-4 h-4"></i>
            <span class="hidden md:inline">Settings</span>
          </button>
        </nav>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-grow max-w-6xl w-full mx-auto p-3 sm:p-6">
      ${state.currentTab === 'new_bill' ? renderBillForm() : ''}
      ${state.currentTab === 'history' ? renderBillHistory() : ''}
      ${state.currentTab === 'preview' ? renderBillPreview() : ''}
      ${state.currentTab === 'settings' ? renderSettingsView() : ''}
    </main>

    <!-- Hidden Print Layout (Used by browser Ctrl+P) -->
    <div id="print-area" class="hidden">
      ${state.activeBill ? renderPrintSheet(state.activeBill) : ''}
    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function renderSyncBadge() {
  if (state.syncStatus === "connected") {
    return `<span class="inline-flex items-center gap-1 bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded-full">
      <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Cloud Synced
    </span>`;
  }
  if (state.syncStatus === "syncing") {
    return `<span class="inline-flex items-center gap-1 bg-amber-950 text-amber-300 border border-amber-700 px-2 py-0.5 rounded-full">
      <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span> Syncing...
    </span>`;
  }
  return `<span onclick="switchTab('settings')" class="cursor-pointer inline-flex items-center gap-1 bg-rose-950 text-rose-300 border border-rose-700 px-2 py-0.5 rounded-full hover:bg-rose-900">
    <span class="w-2 h-2 rounded-full bg-rose-500"></span> ${state.supabaseKey ? 'Connect Error' : 'Local / Setup Supabase'}
  </span>`;
}

// --- TAB: NEW BILL FORM ---
function renderBillForm() {
  const totals = calculateTotals(state.formData.items, state.formData.advance);
  return `
    <div class="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
      <div class="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-4 flex flex-wrap justify-between items-center gap-2">
        <div>
          <h2 class="text-lg font-bold text-slate-800">${state.isEditing ? 'Modify Cash Bill' : 'Create Cash Bill'}</h2>
          <p class="text-xs text-slate-500">Nagarathnamma Screen & Offset Printing Cash Invoice</p>
        </div>
        <div class="flex items-center gap-2">
          ${state.isEditing ? `
            <button type="button" onclick="cancelEdit()" class="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg">Cancel</button>
          ` : ''}
          <button type="button" onclick="resetForm(); render();" class="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border rounded-lg">Clear</button>
        </div>
      </div>

      <form onsubmit="handleSaveBill(event)" class="p-4 sm:p-6 space-y-6">
        <!-- Top Row: Bill No & Date -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-amber-50/60 p-4 rounded-xl border border-amber-100">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Bill No.</label>
            <input type="text" value="${state.formData.bill_no || getNextBillNo()}" oninput="state.formData.bill_no = this.value" class="w-full px-3 py-2 border rounded-lg font-semibold text-slate-900 bg-white shadow-sm focus:ring-2 focus:ring-amber-500 outline-none" required placeholder="1">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Date</label>
            <input type="date" value="${state.formData.bill_date}" oninput="state.formData.bill_date = this.value" class="w-full px-3 py-2 border rounded-lg text-slate-900 bg-white shadow-sm focus:ring-2 focus:ring-amber-500 outline-none" required>
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs font-bold text-slate-700 mb-1">Customer Phone (Optional for WhatsApp)</label>
            <input type="tel" value="${state.formData.customer_phone || ''}" oninput="state.formData.customer_phone = this.value" class="w-full px-3 py-2 border rounded-lg text-slate-900 bg-white shadow-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="10-digit mobile number">
          </div>
        </div>

        <!-- Customer Details (M/s) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">M/s (Customer / Company Name) *</label>
            <input type="text" value="${state.formData.customer_name}" oninput="state.formData.customer_name = this.value" class="w-full px-3 py-2 border rounded-lg text-slate-900 shadow-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="e.g. Ramesh Kumar / Sri Enterprises" required>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Customer Address</label>
            <input type="text" value="${state.formData.customer_address}" oninput="state.formData.customer_address = this.value" class="w-full px-3 py-2 border rounded-lg text-slate-900 shadow-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="e.g. Vidyaranyapura, Bangalore">
          </div>
        </div>

        <!-- Particulars Table -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <h3 class="text-sm font-bold text-slate-800">Particulars (Items / Jobs)</h3>
            <button type="button" onclick="addItemRow()" class="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i> Add Item
            </button>
          </div>

          <div class="overflow-x-auto border rounded-xl border-slate-200 shadow-sm">
            <table class="w-full text-left border-collapse text-sm">
              <thead class="bg-slate-100 text-slate-700 text-xs font-bold border-b uppercase">
                <tr>
                  <th class="py-2.5 px-3 w-12 text-center">Sl.</th>
                  <th class="py-2.5 px-3">PARTICULARS</th>
                  <th class="py-2.5 px-3 w-24 text-right">Qty.</th>
                  <th class="py-2.5 px-3 w-28 text-right">Rate (₹)</th>
                  <th class="py-2.5 px-3 w-32 text-right">Amount (₹)</th>
                  <th class="py-2.5 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${state.formData.items.map((item, idx) => `
                  <tr class="hover:bg-slate-50/80">
                    <td class="py-2 px-3 text-center text-xs text-slate-500 font-semibold">${idx + 1}</td>
                    <td class="py-1 px-3">
                      <input type="text" value="${item.particulars || ''}" oninput="updateItem(${idx}, 'particulars', this.value)" placeholder="e.g. Visiting Cards 500 pcs / Flex Banner" class="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded focus:border-amber-500 outline-none">
                    </td>
                    <td class="py-1 px-3">
                      <input type="number" step="any" value="${item.qty}" oninput="updateItem(${idx}, 'qty', this.value)" placeholder="1" class="w-full px-2.5 py-1.5 text-sm text-right border border-slate-200 rounded focus:border-amber-500 outline-none">
                    </td>
                    <td class="py-1 px-3">
                      <input type="number" step="any" value="${item.rate}" oninput="updateItem(${idx}, 'rate', this.value)" placeholder="0.00" class="w-full px-2.5 py-1.5 text-sm text-right border border-slate-200 rounded focus:border-amber-500 outline-none">
                    </td>
                    <td class="py-2 px-3 text-right font-mono font-bold text-slate-800">
                      ₹${((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)).toFixed(2)}
                    </td>
                    <td class="py-1 px-2 text-center">
                      ${state.formData.items.length > 1 ? `
                        <button type="button" onclick="removeItemRow(${idx})" class="text-slate-400 hover:text-red-600 p-1">
                          <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                      ` : ''}
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Totals & Advance Section -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <!-- Amount in words & Bank Info Preview -->
          <div class="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount in Words</span>
              <p class="text-sm font-semibold text-slate-800 mt-1 italic">${totals.amountInWords}</p>
            </div>
            <div class="pt-2 border-t text-xs text-slate-600">
              <span class="font-bold">Bank Details:</span> ${state.settings.bank_name} | A/c: ${state.settings.account_no} | IFSC: ${state.settings.ifsc_code}
            </div>
          </div>

          <!-- Calculations Column -->
          <div class="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div class="flex justify-between items-center text-sm">
              <span class="text-slate-600 font-medium">Sub Total:</span>
              <span class="font-mono font-bold text-slate-800">₹${totals.subtotal}</span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <label class="text-slate-700 font-medium">Advance Paid:</label>
              <div class="flex items-center gap-1 w-36">
                <span class="text-slate-500">₹</span>
                <input type="number" step="any" value="${state.formData.advance}" oninput="updateAdvance(this.value)" class="w-full px-2 py-1 text-right text-sm border rounded font-mono font-semibold focus:border-amber-500 outline-none">
              </div>
            </div>
            <div class="border-t pt-2.5 flex justify-between items-center">
              <span class="text-base font-bold text-slate-900">Total Amount (Balance):</span>
              <span class="text-xl font-mono font-extrabold text-amber-600">₹${totals.totalAmount}</span>
            </div>
          </div>
        </div>

        <!-- Submit Buttons: All 3 Options -->
        <div class="flex flex-wrap items-center justify-end gap-2.5 pt-4 border-t">
          <button type="button" onclick="handleSaveBill(null, 'new')" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs sm:text-sm border transition flex items-center gap-1.5 shadow-sm">
            <i data-lucide="plus-circle" class="w-4 h-4"></i>
            <span>Save & New Bill</span>
          </button>
          <button type="button" onclick="handleSaveBill(null, 'history')" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs sm:text-sm border transition flex items-center gap-1.5 shadow-sm">
            <i data-lucide="list" class="w-4 h-4"></i>
            <span>Save & View Bills</span>
          </button>
          <button type="button" onclick="handleSaveBill(null, 'print')" class="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-md transition flex items-center gap-2">
            <i data-lucide="printer" class="w-4 h-4"></i>
            <span>Save & Print Bill</span>
          </button>
        </div>
      </form>
    </div>
  `;
}

function addItemRow() {
  state.formData.items.push({ particulars: "", qty: 1, rate: "", amount: 0 });
  render();
}

function removeItemRow(index) {
  if (state.formData.items.length > 1) {
    state.formData.items.splice(index, 1);
    render();
  }
}

function updateItem(index, field, value) {
  state.formData.items[index][field] = value;
  // Live recalculate preview
  const q = parseFloat(state.formData.items[index].qty) || 0;
  const r = parseFloat(state.formData.items[index].rate) || 0;
  state.formData.items[index].amount = Math.round((q * r) * 100) / 100;
}

function updateAdvance(val) {
  state.formData.advance = val;
  render();
}

function cancelEdit() {
  resetForm();
  state.currentTab = "history";
  render();
}

// --- TAB: BILL HISTORY ---
function renderBillHistory() {
  const filtered = state.bills.filter(b => {
    const q = state.searchTerm.toLowerCase();
    return (
      (b.customer_name || "").toLowerCase().includes(q) ||
      String(b.custom_bill_no || b.bill_no).includes(q) ||
      (b.bill_date || "").includes(q)
    );
  });

  return `
    <div class="space-y-4">
      <!-- Search & Summary Bar -->
      <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div class="relative w-full sm:w-72">
          <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-3"></i>
          <input type="text" value="${state.searchTerm}" oninput="state.searchTerm = this.value; render();" placeholder="Search by customer, bill no..." class="w-full pl-9 pr-3 py-2 border rounded-lg text-sm outline-none focus:border-amber-500">
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button onclick="loadBillsFromCloud()" class="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1.5 border">
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5 ${state.syncStatus === 'syncing' ? 'animate-spin' : ''}"></i> Sync Cloud
          </button>
          <button onclick="resetForm(); switchTab('new_bill')" class="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg flex items-center gap-1.5 shadow-sm">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i> New Bill
          </button>
        </div>
      </div>

      <!-- Bill List Cards / Table -->
      ${filtered.length === 0 ? `
        <div class="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
          <i data-lucide="receipt" class="w-12 h-12 text-slate-300 mx-auto mb-3"></i>
          <p class="text-slate-600 font-semibold">No bills found</p>
          <p class="text-xs text-slate-400 mt-1">Create your first cash bill to get started</p>
          <button onclick="resetForm(); switchTab('new_bill')" class="mt-4 px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-lg shadow">Create Bill Now</button>
        </div>
      ` : `
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-sm">
              <thead class="bg-slate-50 text-slate-600 text-xs font-bold border-b uppercase">
                <tr>
                  <th class="py-3 px-4">Bill No</th>
                  <th class="py-3 px-4">Date</th>
                  <th class="py-3 px-4">Customer Name</th>
                  <th class="py-3 px-4 text-right">Total (₹)</th>
                  <th class="py-3 px-4 text-right">Advance (₹)</th>
                  <th class="py-3 px-4 text-right">Balance (₹)</th>
                  <th class="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${filtered.map(b => `
                  <tr class="hover:bg-amber-50/40 transition">
                    <td class="py-3 px-4 font-mono font-bold text-amber-700">#${b.custom_bill_no || b.bill_no}</td>
                    <td class="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">${b.bill_date}</td>
                    <td class="py-3 px-4 font-semibold text-slate-900">
                      <div>${b.customer_name}</div>
                      ${b.customer_phone ? `<div class="text-xs text-slate-400 font-normal">${b.customer_phone}</div>` : ''}
                    </td>
                    <td class="py-3 px-4 text-right font-mono text-slate-600">₹${b.subtotal}</td>
                    <td class="py-3 px-4 text-right font-mono text-slate-500">₹${b.advance || '0.00'}</td>
                    <td class="py-3 px-4 text-right font-mono font-bold text-slate-900">₹${b.total_amount}</td>
                    <td class="py-3 px-4 text-center">
                      <div class="flex items-center justify-center gap-1.5">
                        <button onclick="viewBillPreview('${b.id}')" title="View / Print" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                          <i data-lucide="printer" class="w-4 h-4"></i>
                        </button>
                        <button onclick="shareViaWhatsAppById('${b.id}')" title="WhatsApp" class="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded">
                          <i data-lucide="message-circle" class="w-4 h-4"></i>
                        </button>
                        <button onclick="editBillById('${b.id}')" title="Edit" class="p-1.5 text-slate-600 hover:bg-slate-100 rounded">
                          <i data-lucide="edit" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteBill('${b.id}')" title="Delete" class="p-1.5 text-red-600 hover:bg-red-50 rounded">
                          <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      `}
    </div>
  `;
}

function viewBillPreview(id) {
  const bill = state.bills.find(b => b.id === id);
  if (bill) {
    state.activeBill = bill;
    state.currentTab = "preview";
    render();
  }
}

function editBillById(id) {
  const bill = state.bills.find(b => b.id === id);
  if (bill) editBill(bill);
}

function shareViaWhatsAppById(id) {
  const bill = state.bills.find(b => b.id === id);
  if (bill) shareViaWhatsApp(bill);
}

// --- TAB: PREVIEW & EXACT BILL REPRODUCTION ---
function renderBillPreview() {
  if (!state.activeBill) {
    return `<div class="p-6 text-center">No bill selected. <button onclick="switchTab('history')" class="text-blue-600 underline">Go to bills</button></div>`;
  }
  const bill = state.activeBill;

  return `
    <div class="space-y-4">
      <!-- Action Bar -->
      <div class="bg-white p-3 sm:p-4 rounded-xl shadow-sm border flex flex-wrap items-center justify-between gap-2 no-print">
        <button onclick="switchTab('history')" class="text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1">
          <i data-lucide="arrow-left" class="w-4 h-4"></i> Back to Bills
        </button>
        <div class="flex items-center gap-2">
          <button onclick="editBill(state.activeBill)" class="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 border">
            <i data-lucide="edit" class="w-3.5 h-3.5"></i> Edit
          </button>
          <button onclick="shareViaWhatsApp(state.activeBill)" class="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 shadow-sm">
            <i data-lucide="message-circle" class="w-3.5 h-3.5"></i> WhatsApp
          </button>
          <button onclick="printCurrentBill()" class="px-4 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg flex items-center gap-1.5 shadow">
            <i data-lucide="printer" class="w-4 h-4"></i> Print Bill (A4)
          </button>
        </div>
      </div>

      <!-- Responsive Paper Preview Card -->
      <div class="bg-slate-200/70 p-2 sm:p-6 rounded-2xl flex justify-center overflow-x-auto">
        <div class="bg-white shadow-xl border border-slate-300 w-full max-w-[760px] p-6 sm:p-8 text-black" style="min-height: 980px;">
          ${renderBillCard(bill)}
        </div>
      </div>
    </div>
  `;
}

// Exact representation of the physical Nagarathnamma Cash Bill format
function renderBillCard(bill, isPrint = false) {
  const items = bill.items || [];
  const emptyRowsNeeded = Math.max(0, 11 - items.length);

  return `
    <div class="bill-wrapper bg-white text-black" style="border: 2px solid #000; width: 100%; box-sizing: border-box; font-family: 'Montserrat', Arial, sans-serif;">
      
      <!-- Top CASH BILL bar -->
      <div style="border-bottom: 2px solid #000; padding: 6px 12px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 800; font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase;" class="font-futura">CASH BILL</span>
        <span></span>
      </div>

      <!-- Header: Logo, CMYK Bars, Address -->
      <div style="border-bottom: 2px solid #000; padding: 10px 10px 8px 10px; text-align: center;">
        <div style="font-size: 34px; font-weight: 900; line-height: 1.1; font-style: italic; letter-spacing: -0.01em;" class="font-brand-title">
          ${state.settings.company_name}
        </div>
        <!-- CMYK color chips -->
        <div style="display: flex; justify-content: center; align-items: center; gap: 3px; margin: 4px 0 3px 0;">
          <span style="display: inline-block; width: 16px; height: 6px; background-color: #00AEEF;"></span>
          <span style="display: inline-block; width: 16px; height: 6px; background-color: #EC008C;"></span>
          <span style="display: inline-block; width: 16px; height: 6px; background-color: #FFF200;"></span>
          <span style="display: inline-block; width: 16px; height: 6px; background-color: #000000;"></span>
          <span style="font-weight: 900; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; margin-left: 5px;" class="font-futura">SCREEN & OFFSET PRINTING</span>
        </div>
        <div style="font-size: 11px; font-weight: 600; color: #111;">
          ${state.settings.address}
        </div>
      </div>

      <!-- Customer M/s and No / Date grid -->
      <div style="border-bottom: 2px solid #000; display: flex;">
        <!-- Left: Customer info with dotted pad guidelines -->
        <div style="flex: 1; border-right: 2px solid #000; padding: 10px 12px; min-height: 105px; display: flex; flex-direction: column; justify-content: space-between;">
          <div style="font-size: 13px; font-weight: 700; display: flex; align-items: flex-end;">
            <span style="white-space: nowrap; margin-right: 6px;">M/s.</span>
            <span style="flex: 1; border-bottom: 1.5px dotted #000; font-size: 13px; font-weight: 800; text-transform: uppercase; padding-left: 4px; line-height: 1.3;">
              ${bill.customer_name || ''}
            </span>
          </div>
          <div style="border-bottom: 1.5px dotted #000; font-size: 12px; font-weight: 500; min-height: 22px; line-height: 1.4; padding-left: 36px;">
            ${bill.customer_address || ''}
          </div>
          <div style="border-bottom: 1.5px dotted #000; font-size: 12px; font-weight: 500; min-height: 22px; line-height: 1.4; padding-left: 36px;">
            ${bill.customer_phone ? 'Ph: ' + bill.customer_phone : ''}
          </div>
        </div>

        <!-- Right: No & Date box -->
        <div style="width: 170px; display: flex; flex-direction: column;">
          <div style="border-bottom: 2px solid #000; padding: 6px 10px; flex: 1; display: flex; flex-direction: column; justify-content: center;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase;" class="font-futura">No.</div>
            <div style="font-size: 17px; font-weight: 800; font-family: monospace; letter-spacing: 0.05em; margin-top: 2px;">
              ${bill.custom_bill_no || bill.bill_no}
            </div>
          </div>
          <div style="padding: 6px 10px; flex: 1; display: flex; flex-direction: column; justify-content: center;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase;" class="font-futura">Date:</div>
            <div style="font-size: 13px; font-weight: 700; margin-top: 2px;">
              ${bill.bill_date}
            </div>
          </div>
        </div>
      </div>

      <!-- Unified Main Table (Particulars + Totals seamlessly aligned) -->
      <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
        <colgroup>
          <col style="width: 45px;">
          <col>
          <col style="width: 60px;">
          <col style="width: 85px;">
          <col style="width: 90px;">
          <col style="width: 35px;">
        </colgroup>
        <thead>
          <tr style="border-bottom: 2px solid #000; font-size: 11px; font-weight: 800; text-align: center;" class="font-futura">
            <th style="border-right: 2px solid #000; padding: 6px 2px;">Sl.<br>No.</th>
            <th style="border-right: 2px solid #000; padding: 6px 6px; letter-spacing: 0.08em;">PARTICULARS</th>
            <th style="border-right: 2px solid #000; padding: 6px 2px;">Qty.</th>
            <th style="border-right: 2px solid #000; padding: 6px 2px;">Rate</th>
            <th colspan="2" style="padding: 0;">
              <div style="padding: 4px 0 2px 0; border-bottom: 1px solid #000; letter-spacing: 0.05em;">Amount</div>
              <div style="display: flex;">
                <span style="flex: 1; border-right: 1px solid #000; padding: 2px 0; font-size: 10px;">Rs.</span>
                <span style="width: 35px; padding: 2px 0; font-size: 10px;">Ps.</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          ${items.map((it, idx) => {
            const amtParts = Number(it.amount || 0).toFixed(2).split(".");
            return `
              <tr style="height: 30px; font-size: 12px; font-weight: 600;">
                <td style="border-right: 2px solid #000; text-align: center; padding: 4px 2px; font-family: monospace;">${idx + 1}</td>
                <td style="border-right: 2px solid #000; text-align: left; padding: 4px 8px; font-weight: 700;">${it.particulars}</td>
                <td style="border-right: 2px solid #000; text-align: center; padding: 4px 2px; font-family: monospace;">${it.qty || ''}</td>
                <td style="border-right: 2px solid #000; text-align: right; padding: 4px 6px; font-family: monospace;">${it.rate ? Number(it.rate).toFixed(2) : ''}</td>
                <td style="border-right: 1px solid #000; text-align: right; padding: 4px 6px; font-family: monospace; font-weight: 700;">${amtParts[0]}</td>
                <td style="text-align: center; padding: 4px 2px; font-family: monospace; font-weight: 700;">${amtParts[1]}</td>
              </tr>
            `;
          }).join("")}

          <!-- Fill remaining vertical lines with perfect borders -->
          ${Array.from({ length: emptyRowsNeeded }).map(() => `
            <tr style="height: 28px;">
              <td style="border-right: 2px solid #000;"></td>
              <td style="border-right: 2px solid #000;"></td>
              <td style="border-right: 2px solid #000;"></td>
              <td style="border-right: 2px solid #000;"></td>
              <td style="border-right: 1px solid #000;"></td>
              <td></td>
            </tr>
          `).join("")}
        </tbody>

        <!-- Footer Rows: Total, Advance, Total Amount strictly aligned with Amount columns -->
        <tfoot>
          <!-- Row 1: Total -->
          <tr style="border-top: 2px solid #000; border-bottom: 1px solid #000; height: 32px; font-size: 12px;">
            <td colspan="4" style="border-right: 2px solid #000; text-align: right; padding-right: 14px; font-weight: 800;" class="font-futura">
              Total
            </td>
            <td style="border-right: 1px solid #000; text-align: right; padding-right: 6px; font-weight: 800; font-family: monospace;">
              ${Number(bill.subtotal).toFixed(2).split('.')[0]}
            </td>
            <td style="text-align: center; font-weight: 800; font-family: monospace;">
              ${Number(bill.subtotal).toFixed(2).split('.')[1]}
            </td>
          </tr>

          <!-- Row 2: Advance -->
          <tr style="border-bottom: 1px solid #000; height: 32px; font-size: 12px;">
            <td colspan="4" style="border-right: 2px solid #000; text-align: right; padding-right: 14px; font-weight: 800;" class="font-futura">
              Advance
            </td>
            <td style="border-right: 1px solid #000; text-align: right; padding-right: 6px; font-weight: 800; font-family: monospace;">
              ${Number(bill.advance || 0).toFixed(2).split('.')[0]}
            </td>
            <td style="text-align: center; font-weight: 800; font-family: monospace;">
              ${Number(bill.advance || 0).toFixed(2).split('.')[1]}
            </td>
          </tr>

          <!-- Row 3: Total Amount -->
          <tr style="border-bottom: 2px solid #000; height: 34px; font-size: 13px;">
            <td colspan="4" style="border-right: 2px solid #000; text-align: right; padding-right: 14px; font-weight: 900;" class="font-futura">
              Total Amount
            </td>
            <td style="border-right: 1px solid #000; text-align: right; padding-right: 6px; font-weight: 900; font-family: monospace; font-size: 14px;">
              ${Number(bill.total_amount).toFixed(2).split('.')[0]}
            </td>
            <td style="text-align: center; font-weight: 900; font-family: monospace; font-size: 14px;">
              ${Number(bill.total_amount).toFixed(2).split('.')[1]}
            </td>
          </tr>
        </tfoot>
      </table>

      <!-- Bank Details & Amount in Words Section -->
      <div style="border-bottom: 2px solid #000; padding: 10px 14px;">
        <div style="display: flex; justify-content: space-between; gap: 16px;">
          <!-- Bank Details (strictly matching the PDF text & layout) -->
          <div style="font-size: 11px; line-height: 1.45; min-width: 320px;">
            <div style="font-weight: 900; margin-bottom: 3px; letter-spacing: 0.04em;" class="font-futura">BANK DETAILS :</div>
            <div style="display: flex;"><span style="width: 85px; font-weight: 700;">Name</span><span>: ${state.settings.account_name}</span></div>
            <div style="display: flex;"><span style="width: 85px; font-weight: 700;">A/c No.</span><span style="font-family: monospace; font-weight: 700;">: ${state.settings.account_no}</span></div>
            <div style="display: flex;"><span style="width: 85px; font-weight: 700;">Bank Name</span><span>: ${state.settings.bank_name}</span></div>
            <div style="display: flex;"><span style="width: 85px; font-weight: 700;">Branch</span><span>: ${state.settings.branch}</span></div>
            <div style="display: flex;"><span style="width: 85px; font-weight: 700;">IFSCode</span><span style="font-family: monospace; font-weight: 700;">: ${state.settings.ifsc_code}</span></div>
          </div>
        </div>

        <!-- Amount in Words -->
        <div style="margin-top: 10px; padding-top: 6px; border-top: 1px solid #000; font-size: 12px; display: flex; align-items: flex-end;">
          <span style="font-weight: 700; white-space: nowrap; margin-right: 6px;">Amount in Words</span>
          <span style="flex: 1; border-bottom: 1.5px dotted #000; font-style: italic; font-weight: 800; padding-left: 4px;">
            ${bill.amount_in_words || numberToWords(bill.total_amount)}
          </span>
          <span style="font-weight: 700; margin-left: 6px;">Only.</span>
        </div>
      </div>

      <!-- Signatures Footer -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; padding: 18px 24px 14px 24px;">
        <div style="text-align: center; font-size: 11px; font-weight: 800;" class="font-futura">
          Customer’s Signature
        </div>
        <div style="text-align: center;">
          <div style="font-size: 12px; font-weight: 600; margin-bottom: 24px;">For ${state.settings.company_name}</div>
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase;" class="font-futura">Authorised Signatory</div>
        </div>
      </div>

    </div>
  `;
}

function renderPrintSheet(bill) {
  return `
    <div style="width: 100%; margin: 0; padding: 0; box-sizing: border-box;">
      ${renderBillCard(bill, true)}
    </div>
  `;
}

function printCurrentBill() {
  const printArea = document.getElementById("print-area");
  if (printArea && state.activeBill) {
    printArea.innerHTML = renderPrintSheet(state.activeBill);
  }
  window.print();
}

// --- TAB: SETTINGS & SUPABASE CONFIGURATION ---
function renderSettingsView() {
  return `
    <div class="max-w-2xl mx-auto space-y-6">
      <!-- Supabase Cloud Sync Card -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div class="flex items-center gap-3 border-b pb-4">
          <div class="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
            <i data-lucide="cloud" class="w-6 h-6"></i>
          </div>
          <div>
            <h2 class="text-lg font-bold text-slate-800">Supabase Online Cloud Sync</h2>
            <p class="text-xs text-slate-500">Sync cash bills live between your Mobile phone and Desktop computers</p>
          </div>
        </div>

        <form onsubmit="handleSaveSupabase(event)" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Supabase Project URL</label>
            <input type="url" id="sb-url" value="${state.supabaseUrl}" class="w-full px-3 py-2 border rounded-lg text-sm font-mono bg-slate-50 focus:bg-white outline-none focus:border-amber-500" placeholder="https://xyzcompany.supabase.co" required>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Supabase Anon Public API Key</label>
            <input type="text" id="sb-key" value="${state.supabaseKey}" class="w-full px-3 py-2 border rounded-lg text-sm font-mono bg-slate-50 focus:bg-white outline-none focus:border-amber-500" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..." required>
            <p class="text-[11px] text-slate-500 mt-1">Found in your Supabase project under: <strong>Project Settings -> API -> Project API Keys (anon public)</strong></p>
          </div>

          <div class="pt-2 flex items-center justify-between">
            <span class="text-xs ${state.syncStatus === 'connected' ? 'text-emerald-600 font-semibold' : 'text-slate-500'}">
              Status: ${state.syncStatus.toUpperCase()}
            </span>
            <button type="submit" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow flex items-center gap-1.5">
              <i data-lucide="check" class="w-4 h-4"></i> Save & Connect Supabase
            </button>
          </div>
        </form>
      </div>

      <!-- Company & Bank Details Card -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div class="border-b pb-4">
          <h2 class="text-lg font-bold text-slate-800">Shop & Bank Details</h2>
          <p class="text-xs text-slate-500">Matches the Nagarathnamma bill head and banking transfer info</p>
        </div>

        <form onsubmit="handleSaveCompanySettings(event)" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Shop Name</label>
              <input type="text" id="set-name" value="${state.settings.company_name}" class="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-amber-500">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Tagline</label>
              <input type="text" id="set-tagline" value="${state.settings.tagline}" class="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-amber-500">
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Mobile Phone</label>
            <input type="text" id="set-phone" value="${state.settings.phone}" class="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-amber-500">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Shop Address</label>
            <textarea id="set-address" rows="2" class="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-amber-500">${state.settings.address}</textarea>
          </div>

          <div class="border-t pt-4">
            <h3 class="text-sm font-bold text-slate-800 mb-3">Bank Details (Printed on Bill)</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Bank Name</label>
                <input type="text" id="set-bank" value="${state.settings.bank_name}" class="w-full px-3 py-2 border rounded-lg text-sm outline-none">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Account Holder Name</label>
                <input type="text" id="set-holder" value="${state.settings.account_name}" class="w-full px-3 py-2 border rounded-lg text-sm outline-none">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Account Number</label>
                <input type="text" id="set-acc" value="${state.settings.account_no}" class="w-full px-3 py-2 border rounded-lg text-sm font-mono outline-none">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Branch</label>
                <input type="text" id="set-branch" value="${state.settings.branch}" class="w-full px-3 py-2 border rounded-lg text-sm outline-none">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">IFSC Code</label>
                <input type="text" id="set-ifsc" value="${state.settings.ifsc_code}" class="w-full px-3 py-2 border rounded-lg text-sm font-mono outline-none">
              </div>
            </div>
          </div>

          <div class="pt-2 text-right">
            <button type="submit" class="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow">
              Save Shop Details
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function handleSaveSupabase(e) {
  e.preventDefault();
  const url = document.getElementById("sb-url").value.trim();
  const key = document.getElementById("sb-key").value.trim();
  state.supabaseUrl = url;
  state.supabaseKey = key;
  localStorage.setItem("supabase_url", url);
  localStorage.setItem("supabase_key", key);
  initSupabase();
  render();
  alert("Supabase credentials saved! Connecting to cloud...");
}

function handleSaveCompanySettings(e) {
  e.preventDefault();
  state.settings.company_name = document.getElementById("set-name").value;
  state.settings.tagline = document.getElementById("set-tagline").value;
  state.settings.phone = document.getElementById("set-phone").value;
  state.settings.address = document.getElementById("set-address").value;
  state.settings.bank_name = document.getElementById("set-bank").value;
  state.settings.account_name = document.getElementById("set-holder").value;
  state.settings.account_no = document.getElementById("set-acc").value;
  state.settings.branch = document.getElementById("set-branch").value;
  state.settings.ifsc_code = document.getElementById("set-ifsc").value;
  saveToLocal();
  alert("Company and bank details updated successfully!");
  render();
}

function switchTab(tabName) {
  state.currentTab = tabName;
  render();
}

// Initial boot
loadFromLocal();
resetForm();
initSupabase();
render();
