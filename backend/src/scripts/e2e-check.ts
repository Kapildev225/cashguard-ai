import axios from "axios";

const BASE = "http://localhost:5000"; // Replace with your actual API base URL

let adminToken: string = "";
let ownerToken: string = "";
let staffToken: string = "";
let userToken: string = "";
let clientId: string = "";
let invoiceId: string = "";

const log = (label: string, ok: boolean, extra?: any) => {
  console.log(`${ok ? "✅" : "❌"} ${label}`, extra ? `- ${JSON.stringify(extra)}` : "");
};

async function run() {
    //1 health check
    try {
        const healthRes = await axios.get(`${BASE}/health`);
        log("Health Check", healthRes.status === 200, healthRes.data);
    } catch (error: any) {
        log("Health Check", false, error.response?.data || error.message);
        return;
    }
    // 2 login as seeded users
    try{
        const adminRes = await axios.post(`${BASE}/api/auth/login`, { email: "admin@example.com", password: "admin123" });
        // API responses use the standardized wrapper: { success: true, data: { ... } }
        adminToken = adminRes.data?.data?.token ?? adminRes.data?.token;
        log("Login as ADMIN", !!adminToken);
        // log("Admin Login", true);
    } catch (error: any) {
        log("Admin Login", false, error.response?.data || error.message);   
    }
    try{
        const ownerRes = await axios.post(`${BASE}/api/auth/login`, { email: "owner@example.com", password: "admin123" });
        ownerToken = ownerRes.data?.data?.token ?? ownerRes.data?.token;
        log("Owner Login", !!ownerToken);
    } catch (error: any) {
        log("Owner Login", false, error.response?.data || error.message);
    }
    try{
        // seed creates a Regular User (user@example.com) rather than a staff user,
        // use that account for a non-admin role check.
        const staffRes = await axios.post(`${BASE}/api/auth/login`, { email: "user@example.com", password: "admin123" });
        staffToken = staffRes.data?.data?.token ?? staffRes.data?.token;
        log("Staff Login", !!staffToken);
    } catch (error: any) {
        log("Staff Login", false, error.response?.data || error.message);
    }
    //3 register a new-user
    const testEmail = `e2e_${Date.now()}@cashguard.test`;

     try{
        const res = await axios.post(`${BASE}/api/auth/register`,{
            name:"E2E Test User",
            email: testEmail,
            password:"password123!",

        });
        log("Register new user",res.status===201);
    } catch (error: any) {
      log("Register new user", false, error.response?.data || error.message);
    }
     // 4 .protected route without token-> fail

  try {
    await axios.get(`${BASE}/api/clients`);
    log("Reject request with no token", false, "expected 401 but got success");
  } catch (error: any) {
    log("Reject request with no token", error.response?.status === 401);
  }


    // 5. RBAC — STAFF should be denied /api/users (ADMIN only)

     try{
        await axios.get(`${BASE}/api/users`,{
            headers:{Authorization:`Bearer ${staffToken}`},

        });
        log("RBAC :STAFF denied /api/users",false ,"expected 403")
     }catch (error:any){
        log("RABC :STAFF denied /api/users",error.response?.status === 403);
     }
       // 6. RBAC — ADMIN should be allowed /api/users (even if 501 not-implemented)
  try {
    const res = await axios.get(`${BASE}/api/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    log("RBAC: ADMIN allowed /api/users", res.status < 500);
  } catch (e: any) {
    log("RBAC: ADMIN allowed /api/users", e.response?.status !== 403, e.response?.data);
  }

  // 7. Create a client (OWNER)
  try {
    const res = await axios.post(
      `${BASE}/api/clients`,
      { name: "E2E Test Client", email: `client_${Date.now()}@test.com` },
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );
    clientId = res.data.data.id;
    log("Create client", res.status === 201, clientId);
  } catch (e: any) {
    log("Create client", false, e.response?.data ?? e.message);
  }

  // 8. List clients (pagination shape check)
  try {
    const res = await axios.get(`${BASE}/api/clients`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const hasMeta = res.data.meta && "totalPages" in res.data.meta;
    log("List clients (with meta.totalPages)", res.status === 200 && hasMeta);
  } catch (e: any) {
    log("List clients", false, e.response?.data ?? e.message);
  }

  // 9. Get client by id
  try {
    const res = await axios.get(`${BASE}/api/clients/${clientId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    log("Get client by id", res.status === 200 && res.data.data.id === clientId);
  } catch (e: any) {
    log("Get client by id", false, e.response?.data ?? e.message);
  }

  // 10. Update client
  try {
    const res = await axios.patch(
      `${BASE}/api/clients/${clientId}`,
      { company: "Updated Co" },
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );
    log("Update client", res.status === 200 && res.data.data.company === "Updated Co");
  } catch (e: any) {
    log("Update client", false, e.response?.data ?? e.message);
  }

  // 11. Create an invoice against that client
  try {
    const res = await axios.post(
      `${BASE}/api/invoices`,
      {
        clientId,
        items: [{ description: "Consulting", quantity: 2, unitPrice: 100 }],
        tax: 10,
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      },
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );
    invoiceId = res.data.data.id;
    const totalCorrect = res.data.data.total === 210; // (2*100) + 10 tax
    log("Create invoice with correct totals", res.status === 201 && totalCorrect, res.data.data.total);
  } catch (e: any) {
    log("Create invoice", false, e.response?.data ?? e.message);
  }

  // 12. List invoices
  try {
    const res = await axios.get(`${BASE}/api/invoices`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    log("List invoices", res.status === 200 && Array.isArray(res.data.data));
  } catch (e: any) {
    log("List invoices", false, e.response?.data ?? e.message);
  }

  // 13. RBAC — STAFF denied invoice delete
  try {
    await axios.delete(`${BASE}/api/invoices/${invoiceId}`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    log("RBAC: STAFF denied invoice delete", false, "expected 403");
  } catch (e: any) {
    log("RBAC: STAFF denied invoice delete", e.response?.status === 403);
  }

  // 14. OWNER allowed to delete invoice
  try {
    const res = await axios.delete(`${BASE}/api/invoices/${invoiceId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    log("OWNER allowed invoice delete", res.status === 204);
  } catch (e: any) {
    log("OWNER allowed invoice delete", false, e.response?.data ?? e.message);
  }

  // 15. Clean up — delete the test client
  try {
    const res = await axios.delete(`${BASE}/api/clients/${clientId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    log("Delete client (cleanup)", res.status === 204);
  } catch (e: any) {
    log("Delete client (cleanup)", false, e.response?.data ?? e.message);
  }

  console.log("\n🏁 E2E check complete.");
}

run();