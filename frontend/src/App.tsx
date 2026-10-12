import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./wrapper/pages/Login/LoginPage";
import { DashboardPage } from "./wrapper/Dashboard/DashboardPage";
import { ClientsPage } from "./wrapper/pages/Clients/ClientsPage";
import { InvoicesPage } from "./wrapper/pages/Invoices/InvoicesPage";
import InvoicePreviewPage from "./wrapper/pages/Invoices/InvoicePreviewPage";
import PaymentsPage from "./wrapper/pages/Clients/Payments/PaymentsPage";
import RemindersPage from "./wrapper/pages/Reminder/RemindersPage";
import AIInsightsPage from "./wrapper/pages/AIInsights/AIInsightsPage";
import AIFinanceCopilotPage from "./wrapper/pages/AICopilot/AIFinanceCopilotPage";
import NegotiationAssistantPage from "./wrapper/pages/NegotiationAssistant/NegotiationAssistantPage";
import CashFlowPage from "./wrapper/pages/CashFlow/CashFlowPage";
import BusinessHealthPage from "./wrapper/pages/BusinessHealth/BusinessHealthpage"
import FraudDetectionPage from "./wrapper/pages/FraudDetection/FraudDetectionPage";
import PaymentAnomalyPage from "./wrapper/pages/PaymentAnomaly/PaymentAnomalyPage";
// import NotificationBell from "./wrapper/components/NotificationBell";
// import Sidebar from "./wrapper/Layout/Sidebar";
import NotificationsPage from "./wrapper/pages/Notifications/NotificationPage";
import SettingsPage from "./wrapper/pages/Settings/SettingsPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/clients" element={<ClientsPage />} />
      <Route path="/invoices" element={<InvoicesPage />} />
      <Route path="/invoices/preview" element={<InvoicePreviewPage />} />
      <Route path="/invoices/preview/:id" element={<InvoicePreviewPage />} />
      <Route path="/payments" element={<PaymentsPage />} />
      <Route path="/reminders" element={<RemindersPage />} />
      <Route path="/ai-insights" element={<AIInsightsPage />} />
       <Route path="/ai-copilot" element={<AIFinanceCopilotPage />} />
      <Route path="/negotiation-assistant" element={<NegotiationAssistantPage />} />
      <Route path="/cash-flow" element={<CashFlowPage />} />
      <Route path="/business-health" element={<BusinessHealthPage />} />
      <Route path="/fraud-detection" element={<FraudDetectionPage />} />
      <Route path="/payment-anomaly" element={<PaymentAnomalyPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
       <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
export default App;
