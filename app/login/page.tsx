"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import styles from "./login.module.css"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [forgotMsg, setForgotMsg] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    })

    if (res?.error) {
      setError("ชื่อผู้ใช้ หรือ รหัสผ่านไม่ถูกต้อง")
      setLoading(false)
    } else {
      router.push("/planner")
      router.refresh()
    }
  }

  const handleForgotPassword = () => {
    setForgotMsg("รหัสผ่านใหม่ได้ถูกส่งไปยัง happymorning@gmail.com แล้ว")
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Farm Planner</h1>
        <p className={styles.subtitle}>เข้าสู่ระบบเพื่อจัดการฟาร์มของคุณ</p>
        
        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>ชื่อผู้ใช้ (Username)</label>
            <input 
              type="text" 
              className={styles.input} 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="admin"
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>รหัสผ่าน (Password)</label>
            <div className={styles.passwordWrapper}>
              <input 
                type={showPassword ? "text" : "password"} 
                className={styles.input} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: "100%", paddingRight: "40px" }}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className={styles.eyeBtn}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          
          {error && <div className={styles.error}>{error}</div>}
          
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <div className={styles.forgotPassword}>
          ลืมรหัสผ่านใช่ไหม?{" "}
          <button type="button" onClick={handleForgotPassword} className={styles.forgotBtn}>
            กดที่นี่
          </button>
          {forgotMsg && <div className={styles.successMsg}>{forgotMsg}</div>}
        </div>
      </div>
    </div>
  )
}
