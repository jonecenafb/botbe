require("dotenv").config();
const { ethers } = require("ethers");
const cron = require("node-cron");
const fs = require("fs");
const path = require("path");

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const USDT_ADDRESS = process.env.USDT_ADDRESS;
const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URL);
const wallet = new ethers.Wallet("0x" + process.env.PRIVATE_KEY, provider);

const contractABI = [
  "function withdrawUSDT(uint256 amount) external",
];

const tokenABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);
const usdt = new ethers.Contract(USDT_ADDRESS, tokenABI, provider);

const filePath = path.join(__dirname, "lastWithdrawDate.txt");

async function withdrawUSDT() {
  const today = new Date().toISOString().split("T")[0];

  if (fs.existsSync(filePath)) {
    const lastDate = fs.readFileSync(filePath, "utf8").trim();
    if (lastDate === today) {
      console.log("⏳ Đã rút hôm nay, bỏ qua.");
      return;
    }
  }

  try {
    const balance = await usdt.balanceOf(CONTRACT_ADDRESS);
    const minAmount = ethers.parseUnits("0.01", 6); // USDT có 6 decimals

    if (balance < minAmount) {
      console.log("⚠️ Số dư USDT trong contract quá thấp (< 0.01 USDT). Dừng.");
      return;
    }

    console.log("💸 Đang gửi giao dịch rút USDT...");
    const tx = await contract.withdrawUSDT(balance);
    await tx.wait();
    console.log("✅ Rút thành công:", tx.hash);

    fs.writeFileSync(filePath, today);
  } catch (error) {
    console.error("❌ Lỗi khi rút tiền:", error.message || error);
  }
}

// 🕖 Lên lịch chạy vào **7:00 sáng mỗi ngày**
cron.schedule("0 7 * * *", () => {
  console.log("🚀 Bắt đầu rút tiền lúc 7:00 sáng...");
  withdrawUSDT();
});

// ✅ Bỏ comment để test thủ công nếu cần
// withdrawUSDT();
