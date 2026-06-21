"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { FiCalendar, FiPieChart, FiList, FiLogOut, FiMenu, FiX, FiEye, FiEyeOff, FiAlertCircle } from "react-icons/fi"
import styles from "./AppLayout.module.css"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showPasswordText, setShowPasswordText] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })
  const [passwordLoading, setPasswordLoading] = useState(false)

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return alert("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน")
    }
    setPasswordLoading(true)
    const res = await fetch("/api/users/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
    })
    if (res.ok) {
      alert("เปลี่ยนรหัสผ่านสำเร็จ")
      setShowPasswordModal(false)
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } else {
      const data = await res.json()
      alert(data.error || "เปลี่ยนรหัสผ่านไม่สำเร็จ")
    }
    setPasswordLoading(false)
  }

  const navItems = [
    { name: "ปฏิทินแผนงาน", path: "/planner", icon: <FiCalendar /> },
    { name: "ประวัติการทำงาน (GAP)", path: "/dashboard-b", icon: <FiList /> },
    { name: "ปัญหาเฝ้าระวัง", path: "/issues", icon: <FiAlertCircle /> },
  ]

  if (session?.user?.role === "ADMIN") {
    navItems.splice(1, 0, { name: "แดชบอร์ดภาพรวม", path: "/dashboard-a", icon: <FiPieChart /> })
  }

  return (
    <div className={styles.layout}>
      {/* Mobile Header */}
      <header className={styles.mobileHeader}>
        <div className={styles.logo}>
          <div style={{ 
            width: '236px', height: '68px', 
            backgroundColor: 'var(--color-primary)', 
            WebkitMaskImage: 'url("/logo2.png")', 
            WebkitMaskSize: 'contain', 
            WebkitMaskRepeat: 'no-repeat', 
            WebkitMaskPosition: 'center',
            maskImage: 'url("/logo2.png")',
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center'
          }} title="Farm Planner Logo" />
        </div>
        <button className={styles.menuBtn} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarLogo} style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ 
            width: '304px', height: '101px', 
            backgroundColor: 'var(--color-primary)', 
            WebkitMaskImage: 'url("/logo2.png")', 
            WebkitMaskSize: 'contain', 
            WebkitMaskRepeat: 'no-repeat', 
            WebkitMaskPosition: 'center',
            maskImage: 'url("/logo2.png")',
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center'
          }} title="Farm Planner Logo" />
        </div>
        
        <div className={styles.userProfile}>
          <div className={styles.avatar} style={{ backgroundColor: session?.user?.color || "var(--color-primary)" }}>
            {session?.user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{session?.user?.name}</span>
            <span className={styles.userRole}>{session?.user?.role === "ADMIN" ? "ผู้ดูแลระบบ" : "พนักงาน"}</span>
          </div>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.path)
            return (
              <Link 
                href={item.path} 
                key={item.path} 
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className={styles.icon}>{item.icon}</span>
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className={styles.logoutWrapper}>
          <button className={styles.logoutBtn} onClick={() => setShowPasswordModal(true)} style={{ marginBottom: "0.5rem", background: "transparent", color: "var(--color-text-main)", border: "1px solid var(--color-border)" }}>
            <span className={styles.icon}>🔑</span>
            เปลี่ยนรหัสผ่าน
          </button>
          <button className={styles.logoutBtn} onClick={() => signOut({ callbackUrl: "/login" })}>
            <span className={styles.icon}><FiLogOut /></span>
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Password Modal */}
      {showPasswordModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowPasswordModal(false)}>
          <div style={{ background: "white", padding: "1.5rem", borderRadius: "8px", width: "90%", maxWidth: "400px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0 }}>เปลี่ยนรหัสผ่าน</h3>
              <button onClick={() => setShowPasswordModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><FiX size={20} /></button>
            </div>
            <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.25rem", fontWeight: "bold" }}>รหัสผ่านปัจจุบัน</label>
                <div style={{ position: "relative" }}>
                  <input type={showPasswordText ? "text" : "password"} required value={passwordForm.currentPassword} onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})} style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc", paddingRight: "2.5rem" }} />
                  <button type="button" onClick={() => setShowPasswordText(!showPasswordText)} style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#666", display: "flex", alignItems: "center" }}>
                    {showPasswordText ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.25rem", fontWeight: "bold" }}>รหัสผ่านใหม่</label>
                <div style={{ position: "relative" }}>
                  <input type={showPasswordText ? "text" : "password"} required value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc", paddingRight: "2.5rem" }} />
                  <button type="button" onClick={() => setShowPasswordText(!showPasswordText)} style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#666", display: "flex", alignItems: "center" }}>
                    {showPasswordText ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.25rem", fontWeight: "bold" }}>ยืนยันรหัสผ่านใหม่</label>
                <div style={{ position: "relative" }}>
                  <input type={showPasswordText ? "text" : "password"} required value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc", paddingRight: "2.5rem" }} />
                  <button type="button" onClick={() => setShowPasswordText(!showPasswordText)} style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#666", display: "flex", alignItems: "center" }}>
                    {showPasswordText ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: 0 }}>
                💡 หากลืมรหัสผ่าน กรุณาแจ้งแอดมินเพื่อรีเซ็ตรหัสผ่าน
              </p>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setShowPasswordModal(false)} style={{ flex: 1, padding: "0.5rem", background: "white", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer" }}>ยกเลิก</button>
                <button type="submit" disabled={passwordLoading} style={{ flex: 1, padding: "0.5rem", background: "var(--color-primary)", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div className={styles.overlay} onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* Main Content */}
      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}
