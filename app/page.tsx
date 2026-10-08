'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowUpRight,
  Bell,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Download,
  Edit,
  Edit2,
  Eye,
  FileSpreadsheet,
  Flower2,
  Globe,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Receipt,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  UtensilsCrossed,
  Wallet,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ExpenseItem {
  id?: string
  event_id?: string
  category: string
  item: string
  vendor: string
  vendor_phone?: string
  total: number
  advance: number
  unit?: string
  quantity?: number
  rate_per_unit?: number
}

interface ExpenseLog {
  id: string
  expense_id: string
  amount: number
  type: 'cost_added' | 'payment_made'
  note?: string
  created_at: string
}

interface EventData {
  id: string
  name: string
  category: string
  status: 'Active' | 'Deactive' | 'Cancelled'
  date?: string
  created_at?: string
}

interface VendorData {
  id: string
  name: string
  phone: string
  category: string
  created_at?: string
}

interface StaffData {
  id: string
  name: string
  email: string
  role: string
  is_suspended?: boolean
  photo_url?: string
  id_card_number?: string
  id_card_url?: string
  delete_window_until?: string | null
}

interface DeletionRequest {
  id: string
  staff_id: string
  document_type: string
  status: string
  created_at: string
}

const expenseCategories = [
  { name: 'Decorations', icon: Flower2, color: 'bg-rose-100 text-rose-700' },
  { name: 'Venue', icon: LayoutDashboard, color: 'bg-sky-100 text-sky-700' },
  { name: 'Stationery', icon: ClipboardList, color: 'bg-violet-100 text-violet-700' },
  { name: 'Catering / Food Stalls', icon: UtensilsCrossed, color: 'bg-amber-100 text-amber-700' },
  { name: 'Groceries', icon: ClipboardList, color: 'bg-emerald-100 text-emerald-700' },
  { name: 'Vegetables', icon: Flower2, color: 'bg-lime-100 text-lime-700' },
  { name: 'Others', icon: MoreHorizontal, color: 'bg-slate-100 text-slate-700' },
]

const unitOptions = [
  { label: 'Pcs (Piece)', value: 'pcs' },
  { label: 'Kg (Kilogram)', value: 'kg' },
  { label: 'Plate', value: 'plate' },
  { label: 'Litre', value: 'litre' },
  { label: 'Packet', value: 'packet' },
  { label: 'Box', value: 'box' },
  { label: 'Fixed (Lump sum)', value: 'fixed' },
]

const eventCategories = ['Wedding', 'Birthday Party', 'Annaprashan', 'Corporate Event', 'Other']

const currencyOptions = [
  { code: 'INR', symbol: '₹', label: 'India (INR - ₹)', locale: 'en-IN' },
  { code: 'USD', symbol: '$', label: 'United States (USD - $)', locale: 'en-US' },
  { code: 'EUR', symbol: '€', label: 'Eurozone (EUR - €)', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', label: 'United Kingdom (GBP - £)', locale: 'en-GB' },
  { code: 'AED', symbol: 'AED ', label: 'United Arab Emirates (AED)', locale: 'en-AE' },
  { code: 'BDT', symbol: '৳', label: 'Bangladesh (BDT - ৳)', locale: 'bn-BD' },
  { code: 'CAD', symbol: 'CA$', label: 'Canada (CAD - $)', locale: 'en-CA' },
  { code: 'AUD', symbol: 'AU$', label: 'Australia (AUD - $)', locale: 'en-AU' },
  { code: 'SGD', symbol: 'SG$', label: 'Singapore (SGD - $)', locale: 'en-SG' },
]

export default function Page() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<{ id?: string; role: 'admin' | 'staff'; email: string; name: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const [currentView, setCurrentView] = useState<'dashboard' | 'events' | 'staff' | 'vendors' | 'settings'>('dashboard')
  const [showMobileNav, setShowMobileNav] = useState(false)
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState('INR')

  // Events State
  const [events, setEvents] = useState<EventData[]>([])
  const [selectedDashboardEventId, setSelectedDashboardEventId] = useState<string | null>(null)
  const [viewingEventDetail, setViewingEventDetail] = useState<EventData | null>(null)
  const [showAddEventModal, setShowAddEventModal] = useState(false)
  const [newEventName, setNewEventName] = useState('')
  const [newEventCategory, setNewEventCategory] = useState('Wedding')
  const [newEventDate, setNewEventDate] = useState('')
  const [newEventStatus, setNewEventStatus] = useState<'Active' | 'Deactive' | 'Cancelled'>('Active')

  // Vendors State
  const [vendors, setVendors] = useState<VendorData[]>([])
  const [showAddVendorModal, setShowAddVendorModal] = useState(false)
  const [newVendorName, setNewVendorName] = useState('')
  const [newVendorPhone, setNewVendorPhone] = useState('')
  const [newVendorCategory, setNewVendorCategory] = useState('Decorations')

  // Dashboard Items (Expenses)
  const [activeCategory, setActiveCategory] = useState('All items')
  const [items, setItems] = useState<ExpenseItem[]>([])

  // Add Expense Modal State
  const [showAddItem, setShowAddItem] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [newItemCost, setNewItemCost] = useState('')
  const [newItemAdvance, setNewItemAdvance] = useState('')
  const [newItemCategory, setNewItemCategory] = useState('Decorations')
  const [selectedVendorId, setSelectedVendorId] = useState('')
  const [newItemUnit, setNewItemUnit] = useState('pcs')
  const [newItemQuantity, setNewItemQuantity] = useState<number | ''>(1)
  const [newItemRate, setNewItemRate] = useState<number | ''>('')

  // Edit Expense Item Modal State
  const [editingExpenseItem, setEditingExpenseItem] = useState<ExpenseItem | null>(null)
  const [editItemName, setEditItemName] = useState('')
  const [editItemCost, setEditItemCost] = useState('')
  const [editItemAdvance, setEditItemAdvance] = useState('')
  const [editItemCategory, setEditItemCategory] = useState('Decorations')
  const [editSelectedVendorId, setEditSelectedVendorId] = useState('')
  const [editItemUnit, setEditItemUnit] = useState('pcs')
  const [editItemQuantity, setEditItemQuantity] = useState<number | ''>(1)
  const [editItemRate, setEditItemRate] = useState<number | ''>('')

  // Ledger Modal States
  const [selectedExpenseForLedger, setSelectedExpenseForLedger] = useState<ExpenseItem | null>(null)
  const [expenseLogs, setExpenseLogs] = useState<ExpenseLog[]>([])
  const [transactionAmount, setTransactionAmount] = useState('')
  const [transactionNote, setTransactionNote] = useState('')
  const [activeActionType, setActiveActionType] = useState<'payment_made' | 'cost_added' | null>(null)

  // Edit Inside Ledger Transaction Modal State
  const [editingLog, setEditingLog] = useState<ExpenseLog | null>(null)
  const [editLogAmount, setEditLogAmount] = useState('')
  const [editLogNote, setEditLogNote] = useState('')

  // Staff State
  const [staffList, setStaffList] = useState<StaffData[]>([])
  const [selectedStaff, setSelectedStaff] = useState<StaffData | null>(null)
  const [showAddStaffModal, setShowAddStaffModal] = useState(false)
  const [staffName, setStaffName] = useState('')
  const [staffEmail, setStaffEmail] = useState('')
  const [staffPassword, setStaffPassword] = useState('')
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([])

  // Document Upload States
  const [idCardNumberInput, setIdCardNumberInput] = useState('')
  const [uploadingDoc, setUploadingDoc] = useState(false)

  // Admin Profile & Menu States
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [showAdminCredentialsModal, setShowAdminCredentialsModal] = useState(false)
  const [showConfirmCredentialModal, setShowConfirmCredentialModal] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminPassword, setNewAdminPassword] = useState('')
  const [credentialUpdating, setCredentialUpdating] = useState(false)

  const isAdmin = currentUser?.role === 'admin'

  const currentCurrency = useMemo(() => {
    return currencyOptions.find((c) => c.code === selectedCurrencyCode) || currencyOptions[0]
  }, [selectedCurrencyCode])

  const formatMoney = (value: number) => {
    return `${currentCurrency.symbol}${Number(value || 0).toLocaleString(currentCurrency.locale)}`
  }

  // Auto Calculation for Add Item
  useEffect(() => {
    if (newItemUnit === 'fixed') return
    const q = Number(newItemQuantity) || 0
    const r = Number(newItemRate) || 0
    if (newItemQuantity !== '' && newItemRate !== '') {
      setNewItemCost(String(q * r))
    }
  }, [newItemQuantity, newItemRate, newItemUnit])

  const calculatedDue = useMemo(() => {
    const total = Number(newItemCost) || 0
    const adv = Number(newItemAdvance) || 0
    return Math.max(0, total - adv)
  }, [newItemCost, newItemAdvance])

  // Auto Calculation for Edit Item
  useEffect(() => {
    if (editItemUnit === 'fixed') return
    const q = Number(editItemQuantity) || 0
    const r = Number(editItemRate) || 0
    if (editItemQuantity !== '' && editItemRate !== '') {
      setEditItemCost(String(q * r))
    }
  }, [editItemQuantity, editItemRate, editItemUnit])

  const calculatedEditDue = useMemo(() => {
    const total = Number(editItemCost) || 0
    const adv = Number(editItemAdvance) || 0
    return Math.max(0, total - adv)
  }, [editItemCost, editItemAdvance])

  const fetchData = async () => {
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false })
    if (expensesData) setItems(expensesData)

    const { data: eventsData } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
    if (eventsData) {
      setEvents(eventsData)
      const firstActive = eventsData.find((e) => e.status === 'Active')
      if (firstActive && !selectedDashboardEventId) {
        setSelectedDashboardEventId(firstActive.id)
      }
    }

    const { data: vendorsData } = await supabase
      .from('vendors')
      .select('*')
      .order('name', { ascending: true })
    if (vendorsData) setVendors(vendorsData)

    const { data: staffData } = await supabase
      .from('staff')
      .select('*')
      .order('name', { ascending: true })
    if (staffData) setStaffList(staffData)

    const { data: reqData } = await supabase
      .from('document_deletion_requests')
      .select('*')
      .order('created_at', { ascending: false })
    if (reqData) setDeletionRequests(reqData)
  }

  useEffect(() => {
    const user = localStorage.getItem('ullash_current_user')
    const savedCurrency = localStorage.getItem('ullash_app_currency')
    if (savedCurrency) setSelectedCurrencyCode(savedCurrency)

    if (!user) {
      router.push('/login')
    } else {
      setCurrentUser(JSON.parse(user))
      fetchData()
      setLoading(false)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('ullash_current_user')
    router.push('/login')
  }

  const handleSaveCurrency = (code: string) => {
    setSelectedCurrencyCode(code)
    localStorage.setItem('ullash_app_currency', code)
  }

  const activeEvents = useMemo(() => events.filter((e) => e.status === 'Active'), [events])

  const currentActiveEvent = useMemo(() => {
    return activeEvents.find((e) => e.id === selectedDashboardEventId) || activeEvents[0] || null
  }, [activeEvents, selectedDashboardEventId])

  const targetedEvent = viewingEventDetail || currentActiveEvent

  const currentEventItems = useMemo(() => {
    if (!targetedEvent) return []
    return items.filter((item) => item.event_id === targetedEvent.id)
  }, [items, targetedEvent])

  const totals = useMemo(() => {
    return currentEventItems.reduce(
      (acc, item) => ({
        total: acc.total + Number(item.total || 0),
        advance: acc.advance + Number(item.advance || 0),
      }),
      { total: 0, advance: 0 }
    )
  }, [currentEventItems])

  const due = totals.total - totals.advance

  const filteredItems = useMemo(() => {
    return activeCategory === 'All items'
      ? currentEventItems
      : currentEventItems.filter((item) => item.category === activeCategory)
  }, [currentEventItems, activeCategory])

  // PDF Export
  const handleExportPDF = () => {
    if (!targetedEvent) return
    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.text('ULLASH EVENT MANAGEMENT', 14, 20)
    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(`Event: ${targetedEvent.name} (${targetedEvent.category})`, 14, 28)
    if (targetedEvent.date) doc.text(`Date: ${targetedEvent.date}`, 14, 34)

    const tableRows = currentEventItems.map((item) => {
      const bal = Number(item.total) - Number(item.advance)
      const qtyStr = item.quantity && item.rate_per_unit ? `${item.quantity} ${item.unit || 'pcs'}` : '-'
      return [
        item.item,
        item.category,
        item.vendor,
        qtyStr,
        formatMoney(item.total),
        formatMoney(item.advance),
        formatMoney(bal),
      ]
    })

    autoTable(doc, {
      startY: 42,
      head: [['Item Name', 'Category', 'Vendor', 'Quantity', 'Total', 'Paid', 'Due']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
    })

    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(10)
    doc.setTextColor(0)
    doc.text(`Total Budget: ${formatMoney(totals.total)}`, 14, finalY)
    doc.text(`Paid Amount: ${formatMoney(totals.advance)}`, 14, finalY + 6)
    doc.text(`Remaining Balance: ${formatMoney(due)}`, 14, finalY + 12)

    doc.save(`${targetedEvent.name.replace(/\s+/g, '_')}_Invoice.pdf`)
  }

  // CSV Export
  const handleExportCSV = () => {
    if (!targetedEvent || currentEventItems.length === 0) return
    const headers = ['Item Name', 'Category', 'Vendor', 'Phone', 'Quantity', 'Unit', 'Rate', 'Total', 'Advance', 'Due']
    const rows = currentEventItems.map((i) => [
      `"${i.item}"`,
      `"${i.category}"`,
      `"${i.vendor}"`,
      `"${i.vendor_phone || ''}"`,
      i.quantity || 1,
      i.unit || 'pcs',
      i.rate_per_unit || 0,
      i.total,
      i.advance,
      Number(i.total) - Number(i.advance),
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `${targetedEvent.name}_expenses.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // WhatsApp Receipt
  const handleShareWhatsApp = (item: ExpenseItem, lastAmount?: number) => {
    const balance = Number(item.total) - Number(item.advance)
    let msg = `*Payment Receipt - Ullash Event Management*\n`
    msg += `Event: ${targetedEvent?.name || ''}\n`
    msg += `Vendor/Item: ${item.item} (${item.vendor})\n`
    if (lastAmount) msg += `Recent Paid: ${formatMoney(lastAmount)}\n`
    msg += `Total Cost: ${formatMoney(item.total)}\n`
    msg += `Total Advance Paid: ${formatMoney(item.advance)}\n`
    msg += `*Remaining Balance: ${formatMoney(balance)}*\n\nThank you!`

    const phone = item.vendor_phone ? item.vendor_phone.replace(/\D/g, '') : ''
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  // Add Vendor
  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newVendorName) return

    const { data, error } = await supabase.from('vendors').insert([
      {
        name: newVendorName,
        phone: newVendorPhone,
        category: newVendorCategory,
      },
    ]).select()

    if (!error && data) {
      setVendors((prev) => [...prev, data[0]])
      setNewVendorName('')
      setNewVendorPhone('')
      setShowAddVendorModal(false)
      alert('Vendor successfully registered!')
    } else {
      alert('Error creating vendor: ' + error?.message)
    }
  }

  const handleDeleteVendor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return
    const { error } = await supabase.from('vendors').delete().eq('id', id)
    if (!error) setVendors((prev) => prev.filter((v) => v.id !== id))
  }

  // Add Expense
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemName || !newItemCost || !targetedEvent) return

    const totalVal = Number(newItemCost) || 0
    const advVal = Number(newItemAdvance) || 0
    const qtyVal = Number(newItemQuantity) || 1
    const rateVal = Number(newItemRate) || 0

    const matchedVendor = vendors.find((v) => v.id === selectedVendorId)

    const newExpense: any = {
      event_id: targetedEvent.id,
      category: newItemCategory,
      item: newItemName,
      vendor: matchedVendor ? matchedVendor.name : (currentUser?.name || 'General Vendor'),
      vendor_phone: matchedVendor?.phone || '',
      total: totalVal,
      advance: advVal,
      unit: newItemUnit,
      quantity: qtyVal,
      rate_per_unit: rateVal,
    }

    const { data, error } = await supabase.from('expenses').insert([newExpense]).select()
    if (!error && data && data.length > 0) {
      const createdItem = data[0]
      setItems((prev) => [createdItem, ...prev])

      const initialLogs: any[] = []
      if (totalVal > 0) {
        initialLogs.push({
          expense_id: createdItem.id,
          amount: totalVal,
          type: 'cost_added',
          note: newItemUnit !== 'fixed' && rateVal > 0
            ? `${qtyVal} ${newItemUnit} @ ${formatMoney(rateVal)}/${newItemUnit}`
            : 'Opening Budget / Agreed Cost',
        })
      }
      if (advVal > 0) {
        initialLogs.push({
          expense_id: createdItem.id,
          amount: advVal,
          type: 'payment_made',
          note: 'Advance Payment',
        })
      }

      if (initialLogs.length > 0) {
        await supabase.from('expense_logs').insert(initialLogs)
      }

      setNewItemName('')
      setNewItemCost('')
      setNewItemAdvance('')
      setNewItemQuantity(1)
      setNewItemRate('')
      setNewItemUnit('pcs')
      setSelectedVendorId('')
      setNewItemCategory('Decorations')
      setShowAddItem(false)
    } else {
      alert('Error saving expense: ' + error?.message)
    }
  }

  // Open Full Expense Modal for Editing
  const openEditExpenseModal = (item: ExpenseItem) => {
    setEditingExpenseItem(item)
    setEditItemName(item.item)
    setEditItemCategory(item.category)
    setEditItemUnit(item.unit || 'pcs')
    setEditItemQuantity(item.quantity !== undefined && item.quantity !== null ? item.quantity : 1)
    setEditItemRate(item.rate_per_unit !== undefined && item.rate_per_unit !== null ? item.rate_per_unit : '')
    setEditItemCost(String(item.total || 0))
    setEditItemAdvance(String(item.advance || 0))

    const vMatch = vendors.find((v) => v.name === item.vendor)
    setEditSelectedVendorId(vMatch ? vMatch.id : '')
  }

  // Update Full Expense
  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingExpenseItem?.id || !editItemName || !editItemCost) return

    const totalVal = Number(editItemCost) || 0
    const advVal = Number(editItemAdvance) || 0
    const qtyVal = Number(editItemQuantity) || 1
    const rateVal = Number(editItemRate) || 0

    const matchedVendor = vendors.find((v) => v.id === editSelectedVendorId)

    const updatedPayload = {
      category: editItemCategory,
      item: editItemName,
      vendor: matchedVendor ? matchedVendor.name : (editingExpenseItem.vendor || 'General Vendor'),
      vendor_phone: matchedVendor ? matchedVendor.phone : (editingExpenseItem.vendor_phone || ''),
      total: totalVal,
      advance: advVal,
      unit: editItemUnit,
      quantity: qtyVal,
      rate_per_unit: rateVal,
    }

    const { error } = await supabase
      .from('expenses')
      .update(updatedPayload)
      .eq('id', editingExpenseItem.id)

    if (error) {
      alert('Error updating expense: ' + error.message)
      return
    }

    const updatedItem = { ...editingExpenseItem, ...updatedPayload }
    setItems((prev) => prev.map((item) => (item.id === editingExpenseItem.id ? updatedItem : item)))
    if (selectedExpenseForLedger?.id === editingExpenseItem.id) {
      setSelectedExpenseForLedger(updatedItem)
    }

    setEditingExpenseItem(null)
    alert('Expense successfully updated!')
  }

  // Open Ledger
  const openKhatabookLedger = async (item: ExpenseItem) => {
    setSelectedExpenseForLedger(item)
    setActiveActionType(null)
    setEditingLog(null)
    setTransactionAmount('')
    setTransactionNote('')

    const { data } = await supabase
      .from('expense_logs')
      .select('*')
      .eq('expense_id', item.id)
      .order('created_at', { ascending: false })

    if (data) {
      setExpenseLogs(data)
    }
  }

  // Add Transaction
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedExpenseForLedger?.id || !activeActionType || !transactionAmount) return

    const amt = Number(transactionAmount)
    if (amt <= 0) return

    let updatedTotal = Number(selectedExpenseForLedger.total)
    let updatedAdvance = Number(selectedExpenseForLedger.advance)

    if (activeActionType === 'cost_added') {
      updatedTotal += amt
    } else {
      updatedAdvance += amt
    }

    const { error: expError } = await supabase
      .from('expenses')
      .update({ total: updatedTotal, advance: updatedAdvance })
      .eq('id', selectedExpenseForLedger.id)

    if (expError) {
      alert('Error updating ledger: ' + expError.message)
      return
    }

    const { data: newLog, error: logError } = await supabase
      .from('expense_logs')
      .insert([
        {
          expense_id: selectedExpenseForLedger.id,
          amount: amt,
          type: activeActionType,
          note: transactionNote || (activeActionType === 'cost_added' ? 'Additional Bill / Item Added' : 'Payment Given'),
        },
      ])
      .select()

    if (!logError && newLog) {
      setExpenseLogs((prev) => [newLog[0], ...prev])
      const updatedExpense = { ...selectedExpenseForLedger, total: updatedTotal, advance: updatedAdvance }
      setSelectedExpenseForLedger(updatedExpense)
      setItems((prev) => prev.map((item) => (item.id === selectedExpenseForLedger.id ? updatedExpense : item)))
      setTransactionAmount('')
      setTransactionNote('')
      setActiveActionType(null)
    }
  }

  // Open Edit Inside Ledger Transaction
  const openEditLogModal = (log: ExpenseLog) => {
    setEditingLog(log)
    setEditLogAmount(String(log.amount))
    setEditLogNote(log.note || '')
  }

  // Save Transaction Edit
  const handleUpdateLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLog || !selectedExpenseForLedger?.id || !editLogAmount) return

    const newAmount = Number(editLogAmount)
    if (newAmount <= 0) {
      alert('Please enter a valid amount.')
      return
    }

    const difference = newAmount - Number(editingLog.amount)

    let updatedTotal = Number(selectedExpenseForLedger.total)
    let updatedAdvance = Number(selectedExpenseForLedger.advance)

    if (editingLog.type === 'cost_added') {
      updatedTotal += difference
    } else {
      updatedAdvance += difference
    }

    const { error: expError } = await supabase
      .from('expenses')
      .update({ total: updatedTotal, advance: updatedAdvance })
      .eq('id', selectedExpenseForLedger.id)

    if (expError) {
      alert('Error updating expense total: ' + expError.message)
      return
    }

    const { error: logError } = await supabase
      .from('expense_logs')
      .update({
        amount: newAmount,
        note: editLogNote,
      })
      .eq('id', editingLog.id)

    if (logError) {
      alert('Error updating transaction: ' + logError.message)
      return
    }

    const updatedExpense = { ...selectedExpenseForLedger, total: updatedTotal, advance: updatedAdvance }
    setSelectedExpenseForLedger(updatedExpense)
    setExpenseLogs((prev) =>
      prev.map((l) => (l.id === editingLog.id ? { ...l, amount: newAmount, note: editLogNote } : l))
    )
    setItems((prev) => prev.map((item) => (item.id === selectedExpenseForLedger.id ? updatedExpense : item)))

    setEditingLog(null)
    setEditLogAmount('')
    setEditLogNote('')
  }

  // Delete Transaction
  const handleDeleteLog = async (log: ExpenseLog) => {
    if (!selectedExpenseForLedger?.id) return
    if (!confirm('Are you sure you want to delete this transaction record?')) return

    let updatedTotal = Number(selectedExpenseForLedger.total)
    let updatedAdvance = Number(selectedExpenseForLedger.advance)

    if (log.type === 'cost_added') {
      updatedTotal = Math.max(0, updatedTotal - Number(log.amount))
    } else {
      updatedAdvance = Math.max(0, updatedAdvance - Number(log.amount))
    }

    const { error: logDeleteError } = await supabase.from('expense_logs').delete().eq('id', log.id)
    if (logDeleteError) {
      alert('Error deleting transaction: ' + logDeleteError.message)
      return
    }

    await supabase
      .from('expenses')
      .update({ total: updatedTotal, advance: updatedAdvance })
      .eq('id', selectedExpenseForLedger.id)

    const updatedExpense = { ...selectedExpenseForLedger, total: updatedTotal, advance: updatedAdvance }
    setSelectedExpenseForLedger(updatedExpense)
    setExpenseLogs((prev) => prev.filter((l) => l.id !== log.id))
    setItems((prev) => prev.map((item) => (item.id === selectedExpenseForLedger.id ? updatedExpense : item)))
  }

  const handleDeleteItem = async (id?: string) => {
    if (!id || !confirm('Are you sure you want to delete this item and its transactions?')) return
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (!error) {
      setItems((prev) => prev.filter((item) => item.id !== id))
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEventName) return

    const { data, error } = await supabase
      .from('events')
      .insert([
        {
          name: newEventName,
          category: newEventCategory,
          status: newEventStatus,
          date: newEventDate || null,
        },
      ])
      .select()

    if (!error && data) {
      setEvents((prev) => [data[0], ...prev])
      if (newEventStatus === 'Active') {
        setSelectedDashboardEventId(data[0].id)
      }
      setNewEventName('')
      setNewEventDate('')
      setNewEventCategory('Wedding')
      setNewEventStatus('Active')
      setShowAddEventModal(false)
      alert('Event successfully created!')
    } else {
      alert('Error creating event: ' + error?.message)
    }
  }

  const handleUpdateEventStatus = async (eventId: string, newStatus: 'Active' | 'Deactive' | 'Cancelled') => {
    const { error } = await supabase.from('events').update({ status: newStatus }).eq('id', eventId)
    if (!error) {
      setEvents((prev) => prev.map((ev) => (ev.id === eventId ? { ...ev, status: newStatus } : ev)))
      if (viewingEventDetail?.id === eventId) {
        setViewingEventDetail((prev) => (prev ? { ...prev, status: newStatus } : null))
      }
    }
  }

  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${eventName}"?`)) return
    const { error } = await supabase.from('events').delete().eq('id', eventId)
    if (!error) {
      setEvents((prev) => prev.filter((ev) => ev.id !== eventId))
      if (selectedDashboardEventId === eventId) {
        setSelectedDashboardEventId(null)
      }
      if (viewingEventDetail?.id === eventId) {
        setViewingEventDetail(null)
      }
      alert('Event deleted.')
    }
  }

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!staffName || !staffEmail || !staffPassword) return

    const { error } = await supabase.from('staff').insert([
      {
        name: staffName,
        email: staffEmail.toLowerCase().trim(),
        password: staffPassword,
        role: 'staff',
        is_suspended: false,
      },
    ])

    if (!error) {
      alert(`Staff ${staffName} successfully added!`)
      setStaffName('')
      setStaffEmail('')
      setStaffPassword('')
      setShowAddStaffModal(false)
      fetchData()
    } else {
      alert('Error creating staff: ' + error.message)
    }
  }

  const handleToggleSuspend = async (staff: StaffData) => {
    const updatedStatus = !staff.is_suspended
    const { error } = await supabase.from('staff').update({ is_suspended: updatedStatus }).eq('id', staff.id)
    if (!error) {
      setStaffList((prev) => prev.map((s) => (s.id === staff.id ? { ...s, is_suspended: updatedStatus } : s)))
      if (selectedStaff?.id === staff.id) {
        setSelectedStaff({ ...selectedStaff, is_suspended: updatedStatus })
      }
    }
  }

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Permanently delete staff?')) return
    const { error } = await supabase.from('staff').delete().eq('id', staffId)
    if (!error) {
      setStaffList((prev) => prev.filter((s) => s.id !== staffId))
      setSelectedStaff(null)
    }
  }

  const handleFileUpload = async (file: File, type: 'photo' | 'id_card', staffId: string) => {
    setUploadingDoc(true)
    const fileExt = file.name.split('.').pop()
    const filePath = `${staffId}/${type}_${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage.from('staff_docs').upload(filePath, file)
    if (uploadError) {
      alert('Upload failed: ' + uploadError.message)
      setUploadingDoc(false)
      return
    }

    const { data: urlData } = supabase.storage.from('staff_docs').getPublicUrl(filePath)
    const updateField = type === 'photo' ? { photo_url: urlData.publicUrl } : { id_card_url: urlData.publicUrl }

    const { error: dbError } = await supabase.from('staff').update(updateField).eq('id', staffId)
    if (!dbError) {
      setStaffList((prev) => prev.map((s) => (s.id === staffId ? { ...s, ...updateField } : s)))
      if (selectedStaff?.id === staffId) {
        setSelectedStaff({ ...selectedStaff, ...updateField })
      }
      alert('Document uploaded!')
    }
    setUploadingDoc(false)
  }

  const handleSaveIdCardNumber = async (staffId: string) => {
    if (!idCardNumberInput) return
    const { error } = await supabase.from('staff').update({ id_card_number: idCardNumberInput }).eq('id', staffId)
    if (!error) {
      setStaffList((prev) => prev.map((s) => (s.id === staffId ? { ...s, id_card_number: idCardNumberInput } : s)))
      if (selectedStaff?.id === staffId) {
        setSelectedStaff({ ...selectedStaff, id_card_number: idCardNumberInput })
      }
      alert('ID Identifier saved!')
    }
  }

  const handleRequestDocDelete = async (staffId: string, docType: string) => {
    const { error } = await supabase.from('document_deletion_requests').insert([
      { staff_id: staffId, document_type: docType, status: 'pending' },
    ])
    if (!error) {
      alert('Request sent to admin.')
      fetchData()
    }
  }

  const handleApproveDeletion = async (request: DeletionRequest) => {
    const oneHourLater = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    await supabase.from('staff').update({ delete_window_until: oneHourLater }).eq('id', request.staff_id)
    await supabase.from('document_deletion_requests').update({ status: 'approved' }).eq('id', request.id)
    alert('Approved! 1-hour deletion window opened.')
    fetchData()
  }

  const handleExecuteDeleteDoc = async (staffId: string, docType: 'photo' | 'id_card') => {
    const updateField = docType === 'photo' ? { photo_url: null } : { id_card_url: null, id_card_number: null }
    const { error } = await supabase.from('staff').update(updateField).eq('id', staffId)
    if (!error) {
      setStaffList((prev) => prev.map((s) => (s.id === staffId ? { ...s, ...updateField } : s)))
      if (selectedStaff?.id === staffId) {
        setSelectedStaff({ ...selectedStaff, ...updateField })
      }
      alert('Document deleted.')
    }
  }

  const isDeleteWindowActive = (until?: string | null) => {
    if (!until) return false
    return new Date(until).getTime() > Date.now()
  }

  const handleInitiateUpdateAdmin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) return
    if (!newAdminEmail && !newAdminPassword) {
      alert('Please provide new email or new password to update.')
      return
    }
    setShowConfirmCredentialModal(true)
  }

  const handleConfirmUpdateAdmin = async () => {
    setCredentialUpdating(true)
    const updates: any = {}
    if (newAdminEmail) updates.email = newAdminEmail.trim().toLowerCase()
    if (newAdminPassword) updates.password = newAdminPassword

    const { error } = await supabase
      .from('staff')
      .update(updates)
      .eq('role', 'admin')

    setCredentialUpdating(false)
    setShowConfirmCredentialModal(false)

    if (!error) {
      alert('Admin credentials updated successfully! Please login with your new credentials.')
      handleLogout()
    } else {
      alert('Update failed: ' + error.message)
    }
  }

  if (loading) return null

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-900">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white px-5 py-6 transition-transform lg:translate-x-0 ${showMobileNav ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-10 flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Flower2 size={18} />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight">Ullash</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
                {isAdmin ? 'Admin Workspace' : 'Staff Workspace'}
              </p>
            </div>
          </div>
          <button className="lg:hidden" onClick={() => setShowMobileNav(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>

        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
        <nav className="flex flex-col gap-1">
          <button
            onClick={() => { setCurrentView('dashboard'); setViewingEventDetail(null); setSelectedStaff(null); }}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${currentView === 'dashboard' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <LayoutDashboard size={17} /> Dashboard
          </button>

          <button
            onClick={() => { setCurrentView('events'); setViewingEventDetail(null); setSelectedStaff(null); }}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${currentView === 'events' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <CalendarDays size={17} /> Events
            <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-bold">{events.length}</span>
          </button>

          <button
            onClick={() => { setCurrentView('vendors'); setViewingEventDetail(null); setSelectedStaff(null); }}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${currentView === 'vendors' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <ClipboardList size={17} /> Vendors
            <span className="ml-auto rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">{vendors.length}</span>
          </button>

          <button
            onClick={() => { setCurrentView('staff'); setViewingEventDetail(null); setSelectedStaff(null); }}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${currentView === 'staff' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Users size={17} /> Staff Members
            <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">{staffList.length}</span>
          </button>

          <button
            onClick={() => { setCurrentView('settings'); setViewingEventDetail(null); setSelectedStaff(null); }}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${currentView === 'settings' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Settings size={17} /> Settings
          </button>
        </nav>

        <div className="mt-auto">
          {isAdmin && currentView === 'staff' && (
            <button
              onClick={() => setShowAddStaffModal(true)}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <UserPlus size={15} /> Add Staff Account
            </button>
          )}

          {currentView === 'vendors' && (
            <button
              onClick={() => setShowAddVendorModal(true)}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <Plus size={15} /> Add New Vendor
            </button>
          )}

          <div className="relative rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm">
                  {isAdmin ? <ShieldCheck size={14} /> : <Users size={14} />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 capitalize truncate">{currentUser?.name}</p>
                  <p className="text-[10px] text-slate-400 truncate" title={currentUser?.email}>{currentUser?.email}</p>
                </div>
              </div>

              <div className="relative shrink-0">
                <button
                  onClick={() => setShowAdminMenu((prev) => !prev)}
                  title="Account Options"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700 shadow-sm transition"
                >
                  <Settings size={15} />
                </button>

                {showAdminMenu && (
                  <div className="absolute bottom-full right-0 mb-2 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl z-50">
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setShowAdminMenu(false)
                          setShowAdminCredentialsModal(true)
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        <KeyRound size={14} className="text-slate-400" /> Admin Credentials
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                    >
                      <LogOut size={14} /> Log Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200/80 bg-[#f7f8fa]/90 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setShowMobileNav(true)} aria-label="Open navigation"><Menu size={20} /></button>
            <div>
              <p className="text-xs font-medium text-slate-400 capitalize">Logged in as {currentUser?.role}</p>
              <h1 className="text-xl font-bold tracking-tight">Good day, {currentUser?.name}</h1>
            </div>
          </div>
        </header>

        {/* 1. DASHBOARD VIEW */}
        {currentView === 'dashboard' && (
          <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8">
            <div className="mb-6">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Active Events</p>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {activeEvents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-xs text-slate-400">
                    No active events right now. All events are completed or cancelled. Check the <strong>Events</strong> directory.
                  </div>
                ) : (
                  activeEvents.map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => setSelectedDashboardEventId(ev.id)}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-sm ${
                        currentActiveEvent?.id === ev.id
                          ? 'bg-slate-900 text-white ring-2 ring-slate-900 ring-offset-2'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <span className="size-2 rounded-full bg-emerald-400" />
                      {ev.name}
                      <span className={`ml-1 text-[10px] font-normal ${currentActiveEvent?.id === ev.id ? 'text-slate-300' : 'text-slate-400'}`}>
                        ({ev.category})
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {currentActiveEvent && (
              <>
                <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-emerald-600">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" /> CURRENTLY MANAGING ACTIVE EVENT
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-950">{currentActiveEvent.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Category: {currentActiveEvent.category} {currentActiveEvent.date && `· Date: ${currentActiveEvent.date}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleExportPDF}
                      title="Download Invoice PDF"
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
                    >
                      <Download size={15} /> Invoice PDF
                    </button>
                    <button
                      onClick={handleExportCSV}
                      title="Export CSV / Excel"
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
                    >
                      <FileSpreadsheet size={15} /> CSV
                    </button>
                    <button
                      onClick={() => setShowAddItem(true)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700"
                    >
                      <Plus size={16} /> Add Expense
                    </button>
                  </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-3">
                  <StatCard label="Total Budget" value={formatMoney(totals.total)} helper="Across this event" icon={<Wallet />} />
                  <StatCard label="Paid So Far" value={formatMoney(totals.advance)} helper={`${totals.total > 0 ? Math.round((totals.advance / totals.total) * 100) : 0}% of budget cleared`} icon={<ArrowUpRight />} />
                  <StatCard label="Total Due" value={formatMoney(due)} helper="Pending vendor payouts" icon={<Bell />} danger={due > 0} />
                </section>

                <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_320px]">
                  <div className="min-w-0 rounded-2xl border border-slate-200 bg-white">
                    <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-bold">Expense Overview (Ledger View)</h3>
                        <p className="mt-1 text-xs text-slate-400">Click any row to open ledger history, edit details, or record payments</p>
                      </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-5 py-3">
                      <button onClick={() => setActiveCategory('All items')} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold ${activeCategory === 'All items' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>All items</button>
                      {expenseCategories.map((category) => (
                        <button key={category.name} onClick={() => setActiveCategory(category.name)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold ${activeCategory === category.name ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                          {category.name}
                        </button>
                      ))}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[700px] text-left text-sm">
                        <thead className="bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <tr>
                            <th className="px-5 py-3">Expense item</th>
                            <th className="px-5 py-3">Qty & Rate</th>
                            <th className="px-5 py-3">Total cost</th>
                            <th className="px-5 py-3">Advance paid</th>
                            <th className="px-5 py-3">Due balance</th>
                            <th className="px-5 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredItems.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-5 py-6 text-center text-xs text-slate-400">
                                No expenses logged for this event. Click &ldquo;Add Expense&rdquo; above!
                              </td>
                            </tr>
                          ) : (
                            filteredItems.map((item) => {
                              const balance = Number(item.total) - Number(item.advance)
                              return (
                                <tr
                                  key={item.id || item.item}
                                  className="transition hover:bg-slate-50/70 cursor-pointer"
                                  onClick={() => openKhatabookLedger(item)}
                                >
                                  <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className={`flex size-9 items-center justify-center rounded-xl ${expenseCategories.find((cat) => cat.name === item.category)?.color || 'bg-slate-100 text-slate-700'}`}>
                                        <ClipboardList size={16} />
                                      </div>
                                      <div>
                                        <p className="font-semibold text-slate-800 hover:text-blue-600 transition flex items-center gap-1.5">
                                          {item.item}
                                          <Receipt size={13} className="text-slate-400" />
                                        </p>
                                        <p className="mt-0.5 text-xs text-slate-400">{item.category} · {item.vendor}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-5 py-4 text-xs text-slate-500 font-medium">
                                    {item.quantity && item.rate_per_unit ? (
                                      <span>{item.quantity} {item.unit || 'pcs'} × {formatMoney(item.rate_per_unit)}</span>
                                    ) : (
                                      <span className="text-slate-400">Fixed</span>
                                    )}
                                  </td>
                                  <td className="px-5 py-4 font-medium text-slate-600">{formatMoney(item.total)}</td>
                                  <td className="px-5 py-4 font-medium text-emerald-600">{formatMoney(item.advance)}</td>
                                  <td className="px-5 py-4">
                                    <span className={`font-bold ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatMoney(balance)}</span>
                                    <span className={`ml-2 inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${balance > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                      {balance > 0 ? 'Due' : 'Paid'}
                                    </span>
                                  </td>
                                  <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-1">
                                      {/* Edit Full Item Button */}
                                      <button
                                        onClick={() => openEditExpenseModal(item)}
                                        title="Edit Full Expense Details"
                                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition"
                                      >
                                        <Edit size={16} />
                                      </button>
                                      <button
                                        onClick={() => handleShareWhatsApp(item)}
                                        title="Share Receipt on WhatsApp"
                                        className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition"
                                      >
                                        <MessageCircle size={16} />
                                      </button>
                                      <button
                                        onClick={() => openKhatabookLedger(item)}
                                        title="Open Ledger"
                                        className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition"
                                      >
                                        <Receipt size={16} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteItem(item.id)}
                                        title="Delete Item"
                                        className="rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <aside className="flex flex-col gap-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="mb-5 flex items-center justify-between">
                        <div>
                          <h3 className="font-bold">Payment Progress</h3>
                          <p className="mt-1 text-xs text-slate-400">{currentActiveEvent.name}</p>
                        </div>
                        <span className="text-xl font-bold text-slate-800">
                          {totals.total > 0 ? Math.round((totals.advance / totals.total) * 100) : 0}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${totals.total > 0 ? (totals.advance / totals.total) * 100 : 0}%` }} />
                      </div>
                      <div className="mt-4 flex justify-between text-xs">
                        <span className="text-slate-500">Paid <strong className="text-slate-700">{formatMoney(totals.advance)}</strong></span>
                        <span className="text-rose-600">Due <strong>{formatMoney(due)}</strong></span>
                      </div>
                    </div>
                  </aside>
                </section>
              </>
            )}
          </div>
        )}

        {/* 2. VENDORS DIRECTORY VIEW */}
        {currentView === 'vendors' && (
          <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8">
            <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-950">Vendors Directory</h2>
                <p className="mt-1 text-sm text-slate-500">Manage all decorators, caterers, chefs, sweet shops and their contact details.</p>
              </div>
              <button
                onClick={() => setShowAddVendorModal(true)}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
              >
                <Plus size={17} /> Add New Vendor
              </button>
            </section>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {vendors.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
                  No vendors registered yet. Click &ldquo;Add New Vendor&rdquo; above.
                </div>
              ) : (
                vendors.map((v) => (
                  <div key={v.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-600">
                          {v.category}
                        </span>
                        <button
                          onClick={() => handleDeleteVendor(v.id)}
                          className="text-slate-300 hover:text-rose-600 transition"
                          title="Delete Vendor"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <h4 className="mt-3 font-bold text-slate-900 text-base">{v.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">{v.phone || 'No phone number'}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      {v.phone ? (
                        <a
                          href={`https://wa.me/${v.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:underline"
                        >
                          <MessageCircle size={14} /> WhatsApp Chat
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">No WhatsApp</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 3. EVENTS DIRECTORY & FULL VIEW */}
        {currentView === 'events' && (
          <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8">
            {viewingEventDetail ? (
              <div>
                <button
                  onClick={() => setViewingEventDetail(null)}
                  className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
                >
                  <ArrowLeft size={16} /> Back to Events Directory
                </button>

                <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        viewingEventDetail.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                        viewingEventDetail.status === 'Cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {viewingEventDetail.status === 'Deactive' ? 'Completed' : viewingEventDetail.status}
                      </span>
                      <span className="text-xs font-semibold uppercase text-slate-400">{viewingEventDetail.category}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-950">{viewingEventDetail.name}</h2>
                    {viewingEventDetail.date && (
                      <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                        <CalendarDays size={13} /> Event Date: {viewingEventDetail.date}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleExportPDF}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Download size={14} /> PDF
                    </button>
                    <select
                      value={viewingEventDetail.status}
                      onChange={(e) => handleUpdateEventStatus(viewingEventDetail.id, e.target.value as any)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none"
                    >
                      <option value="Active">Active</option>
                      <option value="Deactive">Deactive (Completed)</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>

                    <button
                      onClick={() => setShowAddItem(true)}
                      className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
                    >
                      <Plus size={15} /> Add Expense
                    </button>
                  </div>
                </div>

                <section className="grid gap-4 sm:grid-cols-3 mb-6">
                  <StatCard label="Total Budget" value={formatMoney(totals.total)} helper="Agreed commitments" icon={<Wallet />} />
                  <StatCard label="Paid So Far" value={formatMoney(totals.advance)} helper={`${totals.total > 0 ? Math.round((totals.advance / totals.total) * 100) : 0}% cleared`} icon={<ArrowUpRight />} />
                  <StatCard label="Total Due" value={formatMoney(due)} helper="Pending payout" icon={<Bell />} danger={due > 0} />
                </section>

                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-400">
                      <tr>
                        <th className="px-5 py-3">Expense item</th>
                        <th className="px-5 py-3">Qty & Rate</th>
                        <th className="px-5 py-3">Total cost</th>
                        <th className="px-5 py-3">Advance paid</th>
                        <th className="px-5 py-3">Due balance</th>
                        <th className="px-5 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredItems.map((item) => {
                        const balance = Number(item.total) - Number(item.advance)
                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50 cursor-pointer transition"
                            onClick={() => openKhatabookLedger(item)}
                          >
                            <td className="px-5 py-4 font-semibold text-slate-800">{item.item}</td>
                            <td className="px-5 py-4 text-xs text-slate-500">
                              {item.quantity && item.rate_per_unit ? (
                                <span>{item.quantity} {item.unit || 'pcs'} × {formatMoney(item.rate_per_unit)}</span>
                              ) : (
                                <span>Fixed</span>
                              )}
                            </td>
                            <td className="px-5 py-4">{formatMoney(item.total)}</td>
                            <td className="px-5 py-4 text-emerald-600 font-medium">{formatMoney(item.advance)}</td>
                            <td className="px-5 py-4 font-bold text-rose-600">{formatMoney(balance)}</td>
                            <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => openEditExpenseModal(item)}
                                  title="Edit Full Expense Details"
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleShareWhatsApp(item)}
                                  title="WhatsApp"
                                  className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"
                                >
                                  <MessageCircle size={16} />
                                </button>
                                <button
                                  onClick={() => openKhatabookLedger(item)}
                                  title="Open Ledger"
                                  className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                                >
                                  <Receipt size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  title="Delete Item"
                                  className="rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-600"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div>
                <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-950">Events Directory</h2>
                    <p className="mt-1 text-sm text-slate-500">View, manage, and inspect all Active, Completed (Deactive), and Cancelled events.</p>
                  </div>
                  <button
                    onClick={() => setShowAddEventModal(true)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                  >
                    <Plus size={18} /> Create Event
                  </button>
                </section>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {events.map((ev) => (
                    <div key={ev.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            ev.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                            ev.status === 'Cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {ev.status === 'Deactive' ? 'Completed' : ev.status}
                          </span>
                          <span className="text-xs text-slate-400">{ev.category}</span>
                        </div>
                        <h4 className="mt-4 text-lg font-bold text-slate-900">{ev.name}</h4>
                        {ev.date && (
                          <p className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
                            <CalendarDays size={13} /> {ev.date}
                          </p>
                        )}
                      </div>

                      <div className="mt-6 border-t border-slate-100 pt-4 flex flex-col gap-3">
                        <button
                          onClick={() => setViewingEventDetail(ev)}
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                        >
                          <Eye size={14} className="text-slate-500" /> View Details & Ledgers
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. STAFF MANAGEMENT VIEW */}
        {currentView === 'staff' && (
          <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8">
            <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-950">Staff & Documents Management</h2>
                <p className="mt-1 text-sm text-slate-500">Handle employee documents, suspension, and deletion windows.</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowAddStaffModal(true)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
                >
                  <UserPlus size={17} /> Add Staff Account
                </button>
              )}
            </section>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {staffList.map((st) => (
                <div key={st.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex size-12 items-center justify-center overflow-hidden rounded-xl bg-slate-100 font-bold text-slate-500">
                      {st.photo_url ? (
                        <img src={st.photo_url} alt={st.name} className="size-full object-cover" />
                      ) : (
                        st.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${st.is_suspended ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {st.is_suspended ? 'Suspended' : 'Active'}
                    </span>
                  </div>

                  <h4 className="mt-3 font-bold text-slate-900">{st.name}</h4>
                  <p className="text-xs text-slate-400">{st.email}</p>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <button
                      onClick={() => setSelectedStaff(st)}
                      className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Receipt size={14} /> Profile & Documents
                    </button>
                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleSuspend(st)}
                          className={`rounded-lg p-1.5 text-xs font-semibold ${st.is_suspended ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'}`}
                        >
                          {st.is_suspended ? <UserCheck size={16} /> : <UserMinus size={16} />}
                        </button>
                        <button onClick={() => handleDeleteStaff(st.id)} className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. GENERAL SETTINGS VIEW */}
        {currentView === 'settings' && (
          <div className="mx-auto max-w-2xl px-5 py-7 sm:px-8 space-y-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-950 mb-2">Settings</h2>
              <p className="text-sm text-slate-500">Configure global preferences for Ullash workspace.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Globe size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Default Currency</h3>
                  <p className="text-xs text-slate-500">Set the currency symbol and format across all transactions and budgets.</p>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-xs font-semibold text-slate-600 block mb-2">Currency Format</label>
                <select
                  value={selectedCurrencyCode}
                  onChange={(e) => handleSaveCurrency(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-slate-500"
                >
                  {currencyOptions.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ADD VENDOR */}
      {showAddVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add New Vendor</h3>
                <p className="text-xs text-slate-500">Save vendor details for fast billing & receipts.</p>
              </div>
              <button onClick={() => setShowAddVendorModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateVendor} className="space-y-3">
              <label className="block text-xs font-semibold text-slate-600">
                Vendor Name / Business
                <input
                  required
                  placeholder="e.g. Ghosh Sweets & Catering"
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                />
              </label>

              <label className="block text-xs font-semibold text-slate-600">
                WhatsApp / Phone Number
                <input
                  placeholder="e.g. 919876543210"
                  value={newVendorPhone}
                  onChange={(e) => setNewVendorPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                />
              </label>

              <label className="block text-xs font-semibold text-slate-600">
                Category
                <select
                  value={newVendorCategory}
                  onChange={(e) => setNewVendorCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                >
                  {expenseCategories.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                className="w-full mt-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                Save Vendor
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD EXPENSE (NEW) */}
      {showAddItem && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Add Expense to {targetedEvent?.name}</h2>
                <p className="mt-1 text-xs text-slate-500">Auto calculation with unit & rate per unit.</p>
              </div>
              <button onClick={() => setShowAddItem(false)} aria-label="Close"><X size={18} /></button>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleAddItem}>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-slate-600">
                  Item Name
                  <input
                    required
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none font-medium"
                    placeholder="e.g. Sweet / Rasgulla / Hall"
                  />
                </label>

                <label className="text-xs font-semibold text-slate-600">
                  Assign Vendor (Optional)
                  <select
                    value={selectedVendorId}
                    onChange={(e) => setSelectedVendorId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 font-medium"
                  >
                    <option value="">General / None</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name} ({v.category})</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <label className="text-xs font-semibold text-slate-600">
                  Category
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 font-medium"
                  >
                    {expenseCategories.map((cat) => (
                      <option key={cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-semibold text-slate-600">
                  Unit
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 font-medium outline-none"
                  >
                    {unitOptions.map((u) => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-semibold text-slate-600">
                  Quantity ({newItemUnit})
                  <input
                    type="number"
                    min="0"
                    step="any"
                    disabled={newItemUnit === 'fixed'}
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none font-medium disabled:bg-slate-50 disabled:text-slate-400"
                    placeholder="e.g. 50"
                  />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <label className="text-xs font-semibold text-slate-600">
                  Rate / {newItemUnit} ({currentCurrency.symbol})
                  <input
                    type="number"
                    min="0"
                    step="any"
                    disabled={newItemUnit === 'fixed'}
                    value={newItemRate}
                    onChange={(e) => setNewItemRate(e.target.value === '' ? '' : Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none font-medium disabled:bg-slate-50 disabled:text-slate-400"
                    placeholder="e.g. 15"
                  />
                </label>

                <label className="text-xs font-semibold text-slate-600">
                  Total Cost ({currentCurrency.symbol})
                  <input
                    required
                    type="number"
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none font-bold bg-slate-50"
                    placeholder="0"
                  />
                </label>

                <label className="text-xs font-semibold text-slate-600">
                  Advance Paid ({currentCurrency.symbol})
                  <input
                    type="number"
                    min="0"
                    value={newItemAdvance}
                    onChange={(e) => setNewItemAdvance(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none font-medium text-emerald-600"
                    placeholder="0"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Total Cost:</span>
                  <span className="text-sm font-bold text-slate-800">{formatMoney(Number(newItemCost) || 0)}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-medium block">Due Balance:</span>
                  <span className={`text-sm font-bold ${calculatedDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatMoney(calculatedDue)}
                  </span>
                </div>
              </div>

              <button type="submit" className="mt-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition shadow-sm">
                Save Expense
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT FULL EXPENSE ITEM */}
      {editingExpenseItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Edit Mode</span>
                <h2 className="text-lg font-bold text-slate-900">Edit Expense Details</h2>
                <p className="mt-0.5 text-xs text-slate-500">Change unit, quantity, rate or vendor anytime.</p>
              </div>
              <button onClick={() => setEditingExpenseItem(null)} aria-label="Close"><X size={18} /></button>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleUpdateExpense}>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-slate-600">
                  Item Name
                  <input
                    required
                    value={editItemName}
                    onChange={(e) => setEditItemName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none font-medium"
                    placeholder="Item name"
                  />
                </label>

                <label className="text-xs font-semibold text-slate-600">
                  Assign Vendor
                  <select
                    value={editSelectedVendorId}
                    onChange={(e) => setEditSelectedVendorId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 font-medium"
                  >
                    <option value="">General / None</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name} ({v.category})</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <label className="text-xs font-semibold text-slate-600">
                  Category
                  <select
                    value={editItemCategory}
                    onChange={(e) => setEditItemCategory(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 font-medium"
                  >
                    {expenseCategories.map((cat) => (
                      <option key={cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-semibold text-slate-600">
                  Unit
                  <select
                    value={editItemUnit}
                    onChange={(e) => setEditItemUnit(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 font-medium outline-none"
                  >
                    {unitOptions.map((u) => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-semibold text-slate-600">
                  Quantity ({editItemUnit})
                  <input
                    type="number"
                    min="0"
                    step="any"
                    disabled={editItemUnit === 'fixed'}
                    value={editItemQuantity}
                    onChange={(e) => setEditItemQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none font-medium disabled:bg-slate-50 disabled:text-slate-400"
                    placeholder="Quantity"
                  />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <label className="text-xs font-semibold text-slate-600">
                  Rate / {editItemUnit} ({currentCurrency.symbol})
                  <input
                    type="number"
                    min="0"
                    step="any"
                    disabled={editItemUnit === 'fixed'}
                    value={editItemRate}
                    onChange={(e) => setEditItemRate(e.target.value === '' ? '' : Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none font-medium disabled:bg-slate-50 disabled:text-slate-400"
                    placeholder="Rate"
                  />
                </label>

                <label className="text-xs font-semibold text-slate-600">
                  Total Cost ({currentCurrency.symbol})
                  <input
                    required
                    type="number"
                    value={editItemCost}
                    onChange={(e) => setEditItemCost(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none font-bold bg-slate-50"
                    placeholder="0"
                  />
                </label>

                <label className="text-xs font-semibold text-slate-600">
                  Advance Paid ({currentCurrency.symbol})
                  <input
                    type="number"
                    min="0"
                    value={editItemAdvance}
                    onChange={(e) => setEditItemAdvance(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none font-medium text-emerald-600"
                    placeholder="0"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Total Cost:</span>
                  <span className="text-sm font-bold text-slate-800">{formatMoney(Number(editItemCost) || 0)}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-medium block">Due Balance:</span>
                  <span className={`text-sm font-bold ${calculatedEditDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatMoney(calculatedEditDue)}
                  </span>
                </div>
              </div>

              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingExpenseItem(null)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: LEDGER PASSBOOK */}
      {selectedExpenseForLedger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="border-b border-slate-100 p-6 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ledger Statement</span>
                  <h2 className="text-xl font-bold text-slate-900">{selectedExpenseForLedger.item}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedExpenseForLedger.category} · {selectedExpenseForLedger.vendor}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleShareWhatsApp(selectedExpenseForLedger)}
                    className="flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                  >
                    <MessageCircle size={14} /> WhatsApp Receipt
                  </button>
                  <button onClick={() => setSelectedExpenseForLedger(null)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3 text-center border border-slate-100">
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Total Cost</p>
                  <p className="mt-0.5 text-sm font-bold text-slate-800">{formatMoney(selectedExpenseForLedger.total)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-emerald-600 uppercase">Paid</p>
                  <p className="mt-0.5 text-sm font-bold text-emerald-600">{formatMoney(selectedExpenseForLedger.advance)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-rose-600 uppercase">Due</p>
                  <p className="mt-0.5 text-sm font-bold text-rose-600">
                    {formatMoney(Number(selectedExpenseForLedger.total) - Number(selectedExpenseForLedger.advance))}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              <p className="text-xs font-bold uppercase text-slate-400">Transaction History</p>
              {expenseLogs.map((log) => (
                <div
                  key={log.id}
                  className={`flex items-center justify-between rounded-2xl border p-3.5 ${
                    log.type === 'cost_added' ? 'border-rose-100 bg-rose-50/40' : 'border-emerald-100 bg-emerald-50/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex size-8 items-center justify-center rounded-xl ${log.type === 'cost_added' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {log.type === 'cost_added' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {log.note || (log.type === 'cost_added' ? 'Additional Cost Added' : 'Payment Given')}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(log.created_at).toLocaleDateString(currentCurrency.locale, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className={`text-sm font-bold ${log.type === 'cost_added' ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {log.type === 'cost_added' ? `+ ${formatMoney(log.amount)}` : `- ${formatMoney(log.amount)}`}
                      </p>
                    </div>

                    {/* Edit Transaction Entry Inside Ledger */}
                    <button
                      onClick={() => openEditLogModal(log)}
                      title="Edit Transaction Record"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition"
                    >
                      <Edit2 size={15} />
                    </button>

                    {/* Delete Transaction */}
                    <button
                      onClick={() => handleDeleteLog(log)}
                      title="Delete Transaction"
                      className="rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 bg-slate-50/80 p-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setTransactionAmount('')
                  setTransactionNote('')
                  setActiveActionType('cost_added')
                }}
                className="flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700"
              >
                <Plus size={16} /> Add Cost
              </button>
              <button
                onClick={() => {
                  setTransactionAmount('')
                  setTransactionNote('')
                  setActiveActionType('payment_made')
                }}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
              >
                <CircleDollarSign size={16} /> Pay / Give Money
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP: ADD COST / PAY MONEY */}
      {activeActionType && selectedExpenseForLedger && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${activeActionType === 'cost_added' ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {activeActionType === 'cost_added' ? 'Increase Bill / Cost' : 'Vendor Payment'}
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {activeActionType === 'cost_added' ? 'Add Extra Cost' : 'Record Payment Given'}
                </h3>
              </div>
              <button onClick={() => setActiveActionType(null)}><X size={18} /></button>
            </div>

            <form onSubmit={handleAddTransaction} className="flex flex-col gap-4">
              <label className="text-xs font-semibold text-slate-600">
                Amount ({currentCurrency.symbol})
                <input
                  required
                  autoFocus
                  type="number"
                  placeholder="0"
                  value={transactionAmount}
                  onChange={(e) => setTransactionAmount(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none font-medium"
                />
              </label>

              <label className="text-xs font-semibold text-slate-600">
                Note / Description (Optional)
                <input
                  placeholder="e.g. Paid via UPI / Cash"
                  value={transactionNote}
                  onChange={(e) => setTransactionNote(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none font-medium"
                />
              </label>

              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveActionType(null)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 rounded-xl py-2.5 text-xs font-bold text-white shadow-sm transition ${
                    activeActionType === 'cost_added' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  Confirm Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP: EDIT INSIDE LEDGER TRANSACTION */}
      {editingLog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${editingLog.type === 'cost_added' ? 'text-rose-600' : 'text-emerald-600'}`}>
                  Edit Record ({editingLog.type === 'cost_added' ? 'Cost' : 'Payment'})
                </span>
                <h3 className="text-lg font-bold text-slate-900">Edit Transaction Entry</h3>
              </div>
              <button onClick={() => setEditingLog(null)}><X size={18} /></button>
            </div>

            <form onSubmit={handleUpdateLog} className="flex flex-col gap-4">
              <label className="text-xs font-semibold text-slate-600">
                Amount ({currentCurrency.symbol})
                <input
                  required
                  autoFocus
                  type="number"
                  placeholder="0"
                  value={editLogAmount}
                  onChange={(e) => setEditLogAmount(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none font-medium"
                />
              </label>

              <label className="text-xs font-semibold text-slate-600">
                Note / Description
                <input
                  placeholder="e.g. Paid via UPI / Cash"
                  value={editLogNote}
                  onChange={(e) => setEditLogNote(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none font-medium"
                />
              </label>

              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingLog(null)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE EVENT */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Create New Event</h2>
              </div>
              <button onClick={() => setShowAddEventModal(false)}><X size={18} /></button>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleCreateEvent}>
              <label className="text-xs font-semibold text-slate-600">
                Event Name
                <input
                  required
                  placeholder="e.g. Rahul Weds Priya"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none font-medium"
                />
              </label>

              <label className="text-xs font-semibold text-slate-600">
                Category
                <select
                  value={newEventCategory}
                  onChange={(e) => setNewEventCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                >
                  {eventCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-semibold text-slate-600">
                Event Date
                <input
                  type="date"
                  required
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                />
              </label>

              <button type="submit" className="mt-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition">
                Create Event
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD STAFF */}
      {showAddStaffModal && isAdmin && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold">Add Staff Member</h2>
              </div>
              <button onClick={() => setShowAddStaffModal(false)}><X size={18} /></button>
            </div>
            <form className="flex flex-col gap-4" onSubmit={handleCreateStaff}>
              <label className="text-xs font-semibold text-slate-600">
                Full Name
                <input
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none"
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Staff Email
                <input
                  required
                  type="email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none"
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Password
                <input
                  required
                  type="password"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none"
                />
              </label>
              <button type="submit" className="mt-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition">
                Save Staff
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADMIN CREDENTIALS */}
      {showAdminCredentialsModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Admin Account Credentials</h2>
              </div>
              <button onClick={() => setShowAdminCredentialsModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleInitiateUpdateAdmin} className="flex flex-col gap-4">
              <label className="text-xs font-semibold text-slate-600">
                New Admin Email
                <input
                  type="email"
                  placeholder={currentUser?.email}
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                New Admin Password
                <input
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                />
              </label>
              <button type="submit" className="mt-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition">
                Save Credentials
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM CREDENTIALS */}
      {showConfirmCredentialModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4">
              <ShieldAlert size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Confirm Credential Update?</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Are you sure? You will be logged out immediately.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmCredentialModal(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={credentialUpdating}
                onClick={handleConfirmUpdateAdmin}
                className="flex-1 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-sm"
              >
                {credentialUpdating ? 'Updating...' : 'Yes, Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function StatCard({ label, value, helper, icon, danger = false }: { label: string; value: string; helper: string; icon: React.ReactNode; danger?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-slate-400">{label}</p>
        <div className={`flex size-8 items-center justify-center rounded-lg ${danger ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'}`}>{icon}</div>
      </div>
      <p className={`mt-4 text-2xl font-bold tracking-tight ${danger ? 'text-rose-600' : 'text-slate-900'}`}>{value}</p>
      <p className={`mt-1 text-xs ${danger ? 'text-rose-500' : 'text-slate-400'}`}>{helper}</p>
    </div>
  )
}