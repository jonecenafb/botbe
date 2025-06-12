require("dotenv").config();
const { ethers } = require("ethers");
const cron = require("node-cron");

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const USDT_ADDRESS = process.env.USDT_ADDRESS;
const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URL);
const wallet = new ethers.Wallet("0x" + process.env.PRIVATE_KEY, provider);

const contractABI = [
  "function withdrawUSDT(uint256 amount) external",
];

const tokenABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);
const usdt = new ethers.Contract(USDT_ADDRESS, tokenABI, provider);

async function withdrawUSDT() {
  try {
    const balance = await usdt.balanceOf(CONTRACT_ADDRESS);
    if (balance === 0n) {
      console.log("Không có USDT để rút.");
      return;
    }

    console.log("Đang gửi giao dịch rút tiền...");
    const tx = await contract.withdrawUSDT(balance);
    await tx.wait();
    console.log("Rút tiền thành công:", tx.hash);
  } catch (error) {
    console.error("Lỗi khi rút tiền:", error.message || error);
  }
}

// 🕖 Lên lịch chạy vào **7:00 sáng mỗi ngày**
cron.schedule("0 0 * * *", () => {
  console.log("👉 Bắt đầu tiến trình rút tiền lúc 7:00 sáng:");
  withdrawUSDT();
});

// ✅ Mở dòng này nếu muốn test thủ công
withdrawUSDT();