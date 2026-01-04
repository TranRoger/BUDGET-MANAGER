/** @type {import('tailwindcss').Config} */
module.exports = {
  // Đảm bảo đường dẫn này trỏ đúng vào các file code của bạn
  content: [
    "./App.{js,jsx,ts,tsx}", 
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}" 
  ],
  presets: [require("nativewind/preset")], // <--- ĐÂY LÀ DÒNG BẠN ĐANG THIẾU
  theme: {
    extend: {},
  },
  plugins: [],
};