import sys
import os
from PyQt6.QtWidgets import (QApplication, QWidget, QVBoxLayout, QHBoxLayout, 
                             QLineEdit, QPushButton, QProgressBar, QLabel, 
                             QComboBox, QMessageBox)
from PyQt6.QtCore import Qt, QThread, pyqtSignal
from PyQt6.QtGui import QFont
import yt_dlp

class DownloadThread(QThread):
    progress = pyqtSignal(float)
    status = pyqtSignal(str)
    finished = pyqtSignal(bool, str)

    def __init__(self, url, resolution, download_dir):
        super().__init__()
        self.url = url
        self.resolution = resolution
        self.download_dir = download_dir

    def run(self):
        try:
            ydl_opts = {
                'outtmpl': os.path.join(self.download_dir, '%(title)s.%(ext)s'),
                'progress_hooks': [self.my_hook],
                'quiet': True,
                'no_warnings': True,
            }
            
            # การตั้งค่าความละเอียดตามที่เลือก
            if self.resolution == 'Audio Only':
                ydl_opts['format'] = 'bestaudio/best'
            elif self.resolution == 'Best Video':
                ydl_opts['format'] = 'bestvideo+bestaudio/best'
            else:
                res_num = self.resolution.replace('p', '')
                ydl_opts['format'] = f'bestvideo[height<={res_num}]+bestaudio/best'

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                self.status.emit("Downloading...")
                ydl.download([self.url])
            self.finished.emit(True, "ดาวน์โหลดสำเร็จแล้ว!")
        except Exception as e:
            self.finished.emit(False, str(e))

    def my_hook(self, d):
        if d['status'] == 'downloading':
            try:
                total_bytes = d.get('total_bytes') or d.get('total_bytes_estimate')
                downloaded_bytes = d.get('downloaded_bytes', 0)
                if total_bytes:
                    percent = (downloaded_bytes / total_bytes) * 100
                    self.progress.emit(percent)
            except:
                pass
        elif d['status'] == 'finished':
            self.progress.emit(100)
            self.status.emit("Processing...")

class YouTubeDownloaderUI(QWidget):
    def __init__(self):
        super().__init__()
        self.initUI()

    def initUI(self):
        self.setWindowTitle('Red Hat University - YouTube Downloader')
        self.setFixedSize(500, 320)
        
        # Modern Dark Theme Colors
        self.setStyleSheet("""
            QWidget {
                background-color: #1e1e2e;
                color: #cdd6f4;
            }
            QLabel {
                font-size: 14px;
                font-weight: bold;
            }
            QLineEdit {
                background-color: #313244;
                border: 1px solid #45475a;
                border-radius: 8px;
                padding: 10px;
                color: #cdd6f4;
            }
            QComboBox {
                background-color: #313244;
                border: 1px solid #45475a;
                border-radius: 8px;
                padding: 10px;
                color: #cdd6f4;
            }
            QComboBox::drop-down {
                border: 0px;
            }
            QPushButton {
                background-color: #f38ba8;
                color: #11111b;
                border: none;
                border-radius: 8px;
                padding: 12px;
                font-weight: bold;
                font-size: 14px;
            }
            QPushButton:hover {
                background-color: #f5a8bd;
            }
            QPushButton:pressed {
                background-color: #e78284;
            }
            QPushButton:disabled {
                background-color: #45475a;
                color: #a6adc8;
            }
            QProgressBar {
                border: 1px solid #45475a;
                border-radius: 8px;
                text-align: center;
                background-color: #313244;
                font-weight: bold;
                color: #1e1e2e;
            }
            QProgressBar::chunk {
                background-color: #a6e3a1;
                border-radius: 8px;
            }
        """)

        layout = QVBoxLayout()
        layout.setSpacing(15)
        layout.setContentsMargins(20, 20, 20, 20)

        # Title
        title_label = QLabel("Red Hat University\nYouTube Downloader")
        title_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        title_label.setStyleSheet("font-size: 22px; font-weight: 900; color: #f38ba8; margin-bottom: 5px;")
        layout.addWidget(title_label)

        # URL Input
        self.url_input = QLineEdit()
        self.url_input.setPlaceholderText("วางลิงก์ YouTube ที่นี่...")
        layout.addWidget(self.url_input)

        # Settings Layout
        settings_layout = QHBoxLayout()
        
        self.res_combo = QComboBox()
        self.res_combo.addItems(["Best Video", "1080p", "720p", "480p", "360p", "Audio Only"])
        self.res_combo.setToolTip("เลือกความละเอียด")
        settings_layout.addWidget(self.res_combo)

        # Download directory (ตั้งค่าโฟลเดอร์อัตโนมัติ)
        self.download_dir = os.path.join(os.path.expanduser("~"), "Downloads", "RHU_YouTube_Downloads")
        if not os.path.exists(self.download_dir):
            os.makedirs(self.download_dir)

        layout.addLayout(settings_layout)
        
        self.dir_label = QLabel(f"บันทึกที่: {self.download_dir}")
        self.dir_label.setStyleSheet("font-size: 11px; color: #a6adc8; font-weight: normal;")
        layout.addWidget(self.dir_label)

        # Progress Bar
        self.progress_bar = QProgressBar()
        self.progress_bar.setValue(0)
        self.progress_bar.setTextVisible(True)
        self.progress_bar.setFixedHeight(25)
        layout.addWidget(self.progress_bar)

        # Status Label
        self.status_label = QLabel("พร้อมใช้งาน")
        self.status_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.status_label.setStyleSheet("font-size: 12px; color: #a6adc8; font-weight: normal;")
        layout.addWidget(self.status_label)

        # Download Button
        self.download_btn = QPushButton("ดาวน์โหลดเลย")
        self.download_btn.clicked.connect(self.start_download)
        layout.addWidget(self.download_btn)

        self.setLayout(layout)

    def start_download(self):
        url = self.url_input.text().strip()
        if not url:
            QMessageBox.warning(self, "แจ้งเตือน", "กรุณาใส่ลิงก์ YouTube ที่ถูกต้อง")
            return

        resolution = self.res_combo.currentText()

        self.download_btn.setEnabled(False)
        self.progress_bar.setValue(0)
        self.status_label.setText("กำลังเตรียมการดาวน์โหลด...")

        self.thread = DownloadThread(url, resolution, self.download_dir)
        self.thread.progress.connect(self.update_progress)
        self.thread.status.connect(self.update_status)
        self.thread.finished.connect(self.download_finished)
        self.thread.start()

    def update_progress(self, value):
        self.progress_bar.setValue(int(value))

    def update_status(self, text):
        self.status_label.setText(text)

    def download_finished(self, success, message):
        self.download_btn.setEnabled(True)
        self.progress_bar.setValue(100 if success else 0)
        self.status_label.setText("เสร็จสิ้น" if success else "เกิดข้อผิดพลาด")
        
        if success:
            QMessageBox.information(self, "สำเร็จ", f"{message}\nไฟล์ถูกบันทึกไว้ที่: {self.download_dir}")
            self.url_input.clear()
        else:
            QMessageBox.critical(self, "ข้อผิดพลาด", f"ไม่สามารถดาวน์โหลดได้:\n{message}")

if __name__ == '__main__':
    app = QApplication(sys.argv)
    
    # พยายามใช้ Font ที่ดู Modern
    font = QFont("Segoe UI", 10)
    app.setFont(font)
    
    window = YouTubeDownloaderUI()
    window.show()
    sys.exit(app.exec())
