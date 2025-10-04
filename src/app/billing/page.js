'use client';
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/app/services/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import { CreditCard, DollarSign, Download, MoreHorizontal, Receipt, Search, Eye, Mail, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Function to determine status badge styling
const getStatusBadge = (status) => {
  switch (status) {
    case "paid":
      return "bg-green-50 text-green-600 border-green-200";
    case "pending":
      return "bg-blue-50 text-blue-600 border-blue-200";
    case "overdue":
      return "bg-red-50 text-red-600 border-red-200";
    case "Paid":
      return "bg-green-50 text-green-600 border-green-200";
    case "Sent":
      return "bg-blue-50 text-blue-600 border-blue-200";
    case "Draft":
      return "bg-gray-50 text-gray-600 border-gray-200";
    case "Overdue":
      return "bg-red-50 text-red-600 border-red-200";
    case "Cancelled":
      return "bg-orange-50 text-orange-600 border-orange-200";
    default:
      return "bg-gray-50 text-gray-600 border-gray-200";
  }
};

export default function Billing() {
  const [searchQuery, setSearchQuery] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Receipt review states
  const [pendingReceipts, setPendingReceipts] = useState([]);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  
  // New states for action dialogs
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMethod: 'bank_transfer',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  
  const [summary, setSummary] = useState({
    totalInvoices: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0
  });

  // Fetch invoices from orders
  const fetchInvoices = async (statusFilter = '') => {
    try {
      setLoading(true);
      const url = statusFilter ? `/billing/from-orders?status=${statusFilter}` : '/billing/from-orders';
      const response = await api.get(url);
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch billing summary
  const fetchSummary = async () => {
    try {
      const response = await api.get('/billing/reports/summary');
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  // Fetch pending payment receipts
  const fetchPendingReceipts = async () => {
    try {
      setReceiptsLoading(true);
      const response = await api.get('/orders?has_receipt=true&verified=false');
      setPendingReceipts(response.data);
    } catch (error) {
      console.error('Error fetching pending receipts:', error);
    } finally {
      setReceiptsLoading(false);
    }
  };

  // Approve payment receipt
  const approveReceipt = async (orderId) => {
    try {
      await api.post(`/orders/${orderId}/approve-receipt`);
      await fetchPendingReceipts();
      setIsReceiptDialogOpen(false);
      alert('Receipt approved successfully!');
    } catch (error) {
      console.error('Error approving receipt:', error);
      alert('Failed to approve receipt. Please try again.');
    }
  };

  // Reject payment receipt
  const rejectReceipt = async (orderId, reason = '') => {
    try {
      await api.post(`/orders/${orderId}/reject-receipt`, { reason });
      await fetchPendingReceipts();
      setIsReceiptDialogOpen(false);
      alert('Receipt rejected. Customer will be notified.');
    } catch (error) {
      console.error('Error rejecting receipt:', error);
      alert('Failed to reject receipt. Please try again.');
    }
  };

  // download PDF 25

  // View invoice details
  const viewDetails = (invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailsDialogOpen(true);
  };

  // Record payment
  const recordPayment = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentData({
      amount: invoice.total || 0,
      paymentMethod: 'bank_transfer',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setIsPaymentDialogOpen(true);
  };

  // Submit payment record
  const submitPaymentRecord = async () => {
    try {
      if (!selectedInvoice) return;
        await api.post(`/orders/${selectedInvoice._id}/record-payment`, {
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        paymentDate: paymentData.paymentDate,
        notes: paymentData.notes
      });
      
      setIsPaymentDialogOpen(false);
      fetchInvoices();
      fetchSummary();
      alert('Payment recorded successfully!');
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Failed to record payment. Please try again.');
    }
  };
  // Send reminder
  const sendReminder = async (invoice) => {
    try {
      await api.post(`/orders/${invoice._id}/send-reminder`, {
        customerEmail: invoice.customer?.email,
        invoiceId: invoice.invoiceId,
        amount: invoice.total,
        dueDate: invoice.dueDate
      });
      
      alert('Payment reminder sent successfully!');
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Failed to send reminder. Please try again.');
    }
  };

  // Delete invoice
  const deleteInvoice = async (invoice) => {
    if (confirm(`Are you sure you want to delete invoice ${invoice.invoiceId}? This action cannot be undone.`)) {
      try {
        // Since invoices are based on orders, we'll mark the order as cancelled/deleted
        await api.patch(`/orders/${invoice._id}`, {
          status: 'cancelled',
          notes: 'Order cancelled - invoice deleted'
        });
        
        fetchInvoices();
        fetchSummary();
        alert('Invoice deleted successfully!');
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Failed to delete invoice. Please try again.');
      }
    }
  };

// 24 generateStatement function
  useEffect(() => {
    fetchInvoices();
    fetchSummary();
    fetchPendingReceipts();
  }, []);

  // Filter invoices based on search query
  const filteredInvoices = invoices.filter((invoice) => {
    return (
      invoice.invoiceId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Calculate totals from actual data
  const totalRevenue = summary.totalAmount || 0;
  const paidRevenue = summary.paidAmount || 0;
  const pendingRevenue = summary.pendingAmount || 0;
  const overdueRevenue = summary.overdueAmount || 0;

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Billing & Invoices</h1>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">For all time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CreditCard className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(paidRevenue)}</div>
            <p className="text-xs text-muted-foreground">Received payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Receipt className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingRevenue)}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <Receipt className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overdueRevenue)}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all-invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all-invoices">All Invoices</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="receipt-review">Receipt Review</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all-invoices" className="space-y-4">
          {/* Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search invoices..." className="pl-8 bg-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
            </div>
            {/* Export button 23 */}
          </div>
          {/* Invoices Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      Loading invoices...
                    </TableCell>
                  </TableRow>
                ) : filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.invoiceId}</div>
                          <div className="text-sm text-muted-foreground">{invoice.orderId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.customer?.name}</div>
                          <div className="text-sm text-muted-foreground">{invoice.customer?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusBadge(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(invoice.total)}
                      </TableCell>
                      <TableCell>
                        {invoice.paymentMethod ? (
                          <div>
                            <div>{invoice.paymentMethod}</div>
                            <div className="text-sm text-muted-foreground">
                              {invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString() : '-'}
                            </div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => viewDetails(invoice)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {invoice.status !== "Paid" && (
                              <DropdownMenuItem onClick={() => recordPayment(invoice)}>
                                <DollarSign className="h-4 w-4 mr-2" />
                                Record Payment
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => sendReminder(invoice)}>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Reminder
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => deleteInvoice(invoice)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Invoice
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      No invoices found matching your criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        <TabsContent value="paid" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      Loading invoices...
                    </TableCell>
                  </TableRow>
                ) : invoices.filter(invoice => 
                    invoice.status === 'paid' && 
                    (invoice.invoiceId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     invoice.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     invoice.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                  ).length > 0 ? (
                  invoices.filter(invoice => 
                    invoice.status === 'paid' && 
                    (invoice.invoiceId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     invoice.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     invoice.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                  ).map((invoice) => (
                    <TableRow key={invoice._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.invoiceId}</div>
                          <div className="text-sm text-muted-foreground">{invoice.orderId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.customer?.name}</div>
                          <div className="text-sm text-muted-foreground">{invoice.customer?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusBadge(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(invoice.total)}
                      </TableCell>
                      <TableCell>
                        {invoice.paymentMethod ? (
                          <div>
                            <div>{invoice.paymentMethod}</div>
                            <div className="text-sm text-muted-foreground">
                              {invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString() : '-'}
                            </div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => viewDetails(invoice)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      No paid invoices found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        <TabsContent value="pending" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      Loading invoices...
                    </TableCell>
                  </TableRow>
                ) : invoices.filter(invoice => 
                    invoice.status === 'pending' && 
                    (invoice.invoiceId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     invoice.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     invoice.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                  ).length > 0 ? (
                  invoices.filter(invoice => 
                    invoice.status === 'pending' && 
                    (invoice.invoiceId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     invoice.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     invoice.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                  ).map((invoice) => (
                    <TableRow key={invoice._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.invoiceId}</div>
                          <div className="text-sm text-muted-foreground">{invoice.orderId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.customer?.name}</div>
                          <div className="text-sm text-muted-foreground">{invoice.customer?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusBadge(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(invoice.total)}
                      </TableCell>
                      <TableCell>
                        {invoice.paymentMethod ? (
                          <div>
                            <div>{invoice.paymentMethod}</div>
                            <div className="text-sm text-muted-foreground">
                              {invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString() : '-'}
                            </div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => viewDetails(invoice)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => recordPayment(invoice)}>
                              <DollarSign className="h-4 w-4 mr-2" />
                              Record Payment
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => sendReminder(invoice)}>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Reminder
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      No pending invoices found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        <TabsContent value="overdue" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      Loading invoices...
                    </TableCell>
                  </TableRow>
                ) : invoices.filter(invoice => 
                    invoice.status === 'overdue' && 
                    (invoice.invoiceId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     invoice.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     invoice.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                  ).length > 0 ? (
                  invoices.filter(invoice => 
                    invoice.status === 'overdue' && 
                    (invoice.invoiceId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     invoice.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     invoice.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                  ).map((invoice) => (
                    <TableRow key={invoice._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.invoiceId}</div>
                          <div className="text-sm text-muted-foreground">{invoice.orderId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.customer?.name}</div>
                          <div className="text-sm text-muted-foreground">{invoice.customer?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusBadge(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(invoice.total)}
                      </TableCell>
                      <TableCell>
                        {invoice.paymentMethod ? (
                          <div>
                            <div>{invoice.paymentMethod}</div>
                            <div className="text-sm text-muted-foreground">
                              {invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString() : '-'}
                            </div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem onClick={() => viewDetails(invoice)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => recordPayment(invoice)}>
                              <DollarSign className="h-4 w-4 mr-2" />
                              Record Payment
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => sendReminder(invoice)}>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Reminder
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      No overdue invoices found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="receipt-review" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Payment Receipt Review</h3>
            <Button onClick={fetchPendingReceipts} variant="outline">
              Refresh
            </Button>
          </div>
          
          {receiptsLoading ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Loading receipts...</p>
            </div>
          ) : pendingReceipts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No pending receipts to review</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingReceipts.map((order) => (
                <Card key={order._id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{order.orderId}</h4>
                        <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                        <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                      </div>
                      <Badge variant="outline">
                        {formatCurrency(order.total || order.final_amount)}
                      </Badge>
                    </div>
                    
                    {order.payment_receipt && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          Uploaded: {new Date(order.payment_receipt.uploadDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          File: {order.payment_receipt.originalName}
                        </p>
                        
                        {/* Show payment details if available */}
                        {order.payment_receipt.paymentDetails && (
                          <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                            <p className="text-xs font-medium text-yellow-800 mb-1">Payment Details:</p>
                            <p className="text-xs text-yellow-700">
                              <strong>Bank:</strong> {order.payment_receipt.paymentDetails.bank}
                            </p>
                            <p className="text-xs text-yellow-700">
                              <strong>Amount:</strong> {formatCurrency(order.payment_receipt.paymentDetails.depositedAmount)}
                              {Math.abs(order.payment_receipt.paymentDetails.depositedAmount - (order.total || order.final_amount)) > 0.01 && (
                                <span className="text-red-600 ml-1">⚠️</span>
                              )}
                            </p>
                            <p className="text-xs text-yellow-700">
                              <strong>Date:</strong> {new Date(order.payment_receipt.paymentDetails.paymentDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedReceipt(order); setIsReceiptDialogOpen(true); }}>
                        View Details
                      </Button>
                      <Button size="sm" onClick={() => approveReceipt(order._id)} className="bg-green-600 hover:bg-green-700">
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => rejectReceipt(order._id)}>
                        Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Receipt Review Dialog */}
      <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payment Receipt Review</DialogTitle>
            <DialogDescription>
              {selectedReceipt && `Order #${selectedReceipt.orderId} - ${selectedReceipt.customer_name}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReceipt && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold mb-2 text-blue-800">Order Details</h4>
                  <p><strong>Order ID:</strong> {selectedReceipt.orderId}</p>
                  <p><strong>Customer:</strong> {selectedReceipt.customer_name}</p>
                  <p><strong>Email:</strong> {selectedReceipt.customer_email}</p>
                  <p><strong>Order Amount:</strong> <span className="text-lg font-bold text-blue-600">{formatCurrency(selectedReceipt.total || selectedReceipt.final_amount)}</span></p>
                  <p><strong>Status:</strong> {selectedReceipt.status}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2 text-gray-800">Receipt File Info</h4>
                  {selectedReceipt.payment_receipt && (
                    <>
                      <p><strong>File:</strong> {selectedReceipt.payment_receipt.originalName}</p>
                      <p><strong>Uploaded:</strong> {new Date(selectedReceipt.payment_receipt.uploadDate).toLocaleString()}</p>
                      <p><strong>Status:</strong> <span className="text-orange-600 font-medium">Pending Verification</span></p>
                    </>
                  )}
                </div>
              </div>

              {/* Payment Details Section */}
              {selectedReceipt.payment_receipt && selectedReceipt.payment_receipt.paymentDetails && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold mb-3 text-yellow-800">Customer-Provided Payment Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-yellow-700"><strong>Bank:</strong></p>
                      <p className="font-medium">{selectedReceipt.payment_receipt.paymentDetails.bank}</p>
                    </div>
                    <div>
                      <p className="text-sm text-yellow-700"><strong>Branch:</strong></p>
                      <p className="font-medium">{selectedReceipt.payment_receipt.paymentDetails.branch}</p>
                    </div>
                    <div>
                      <p className="text-sm text-yellow-700"><strong>Deposited Amount:</strong></p>
                      <p className="font-medium text-lg text-green-600">
                        {formatCurrency(selectedReceipt.payment_receipt.paymentDetails.depositedAmount)}
                      </p>
                      {Math.abs(selectedReceipt.payment_receipt.paymentDetails.depositedAmount - (selectedReceipt.total || selectedReceipt.final_amount)) > 0.01 && (
                        <p className="text-xs text-red-600 mt-1">Amount doesn't match order total</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-yellow-700"><strong>Payment Date:</strong></p>
                      <p className="font-medium">{new Date(selectedReceipt.payment_receipt.paymentDetails.paymentDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Show message if no payment details */}
              {selectedReceipt.payment_receipt && !selectedReceipt.payment_receipt.paymentDetails && (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <p className="text-orange-700 text-sm">
                    <strong>Note:</strong> No payment details were provided with this receipt. The customer uploaded this receipt using the old system.
                  </p>
                </div>
              )}
              
              {selectedReceipt.payment_receipt && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Receipt Image</h4>
                  <div className="max-h-96 overflow-auto">
                    <img src={`http://localhost:5000/uploads/receipts/${selectedReceipt.payment_receipt.filename}`} alt="Payment Receipt" className="max-w-full h-auto rounded border" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}/>
                    <div style={{display: 'none'}} className="p-8 text-center text-muted-foreground border rounded">
                      Receipt image could not be loaded. File: {selectedReceipt.payment_receipt.originalName}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button onClick={() => approveReceipt(selectedReceipt._id)} className="flex-1 bg-green-600 hover:bg-green-700">
                  ✅ Approve Payment
                </Button>
                <Button variant="destructive" onClick={() => rejectReceipt(selectedReceipt._id)} className="flex-1">
                  ❌ Reject Payment
                </Button>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReceiptDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details - {selectedInvoice?.invoiceId}</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              {/* Invoice Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Invoice Information</h3>
                  <div className="space-y-2">
                    <p><strong>Invoice ID:</strong> {selectedInvoice.invoiceId}</p>
                    <p><strong>Issue Date:</strong> {new Date(selectedInvoice.issueDate).toLocaleDateString()}</p>
                    <p><strong>Due Date:</strong> {new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedInvoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                      selectedInvoice.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                      selectedInvoice.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>{selectedInvoice.status}</span></p>
                    <p><strong>Amount:</strong> Rs. {selectedInvoice.total?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Customer Information</h3>
                  <div className="space-y-2">
                    <p><strong>Name:</strong> {selectedInvoice.customer?.name || 'N/A'}</p>
                    <p><strong>Email:</strong> {selectedInvoice.customer?.email || 'N/A'}</p>
                    <p><strong>Phone:</strong> {selectedInvoice.customer?.phone || 'N/A'}</p>
                    <p><strong>Address:</strong> {selectedInvoice.customer?.address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Items/Services */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Items/Services</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left">Description</th>
                        <th className="px-4 py-3 text-right">Quantity</th>
                        <th className="px-4 py-3 text-right">Unit Price</th>
                        <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                        selectedInvoice.items.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-3">{item.product || item.item_name || 'Service'}</td>
                            <td className="px-4 py-3 text-right">{item.quantity || 1}</td>
                            <td className="px-4 py-3 text-right">Rs. {(item.unit_price || item.price || 0).toFixed(2)}</td>
                            <td className="px-4 py-3 text-right">Rs. {((item.quantity || 1) * (item.unit_price || item.price || 0)).toFixed(2)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr className="border-t">
                          <td className="px-4 py-3" colSpan="4">Order services</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-right">
                  <p className="text-lg font-semibold">Total: Rs. {selectedInvoice.total?.toFixed(2) || '0.00'}</p>
                </div>
              </div>

              {/* Payment History */}
              {selectedInvoice.paymentHistory && selectedInvoice.paymentHistory.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Payment History</h3>
                  <div className="space-y-2">
                    {selectedInvoice.paymentHistory.map((payment, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded">
                        <p><strong>Date:</strong> {new Date(payment.date).toLocaleDateString()}</p>
                        <p><strong>Amount:</strong> Rs. {payment.amount?.toFixed(2)}</p>
                        <p><strong>Method:</strong> {payment.method}</p>
                        {payment.notes && <p><strong>Notes:</strong> {payment.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedInvoice.notes && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Notes</h3>
                  <p className="p-3 bg-gray-50 rounded">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment - {selectedInvoice?.invoiceId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Payment Amount</Label>
              <Input id="amount" type="number" step="0.01" value={paymentData.amount} onChange={(e) => setPaymentData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))} placeholder="Enter amount"/>
            </div>
            
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select 
                value={paymentData.paymentMethod} 
                onValueChange={(value) => setPaymentData(prev => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentData.paymentDate}
                onChange={(e) => setPaymentData(prev => ({ ...prev, paymentDate: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={paymentData.notes}
                onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any notes about the payment..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitPaymentRecord}>
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
