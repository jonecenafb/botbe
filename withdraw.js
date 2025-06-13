

require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

console.log("ENV loaded:");
console.log("PRIVATE_KEY length:", process.env.PRIVATE_KEY?.length);
console.log("PROVIDER_URL:", process.env.PROVIDER_URL?.slice(0, 30), "...");


(async () => {
  const PROVIDER_URL = process.env.PROVIDER_URL;
  let PRIVATE_KEY = process.env.PRIVATE_KEY;
  if (!PRIVATE_KEY.startsWith("0x")) {
    PRIVATE_KEY = "0x" + PRIVATE_KEY;
  }
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
  const USDT_ADDRESS = process.env.USDT_ADDRESS;

  const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    ["function withdrawUSDT(uint256 amount) external"],
    wallet
  );

  const usdt = new ethers.Contract(
    USDT_ADDRESS,
    ["function balanceOf(address) view returns (uint256)"],
    provider
  );

  // --- Check nếu đã rút hôm nay chưa ---
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const filePath = path.join(__dirname, "lastWithdrawDate.txt");

  if (fs.existsSync(filePath)) {
    const lastDate = fs.readFileSync(filePath, "utf8").trim();
    if (lastDate === today) {
      console.log("Đã rút USDT hôm nay. Dừng.");
      process.exit(0);
    }
  }

  try {
    const balance = await usdt.balanceOf(CONTRACT_ADDRESS);

    // So sánh với 0.01 USDT (với 6 decimals)
    const minAmount = ethers.parseUnits("0.01", 6);
    if (balance < minAmount) {
      console.log("Balance USDT trong contract quá nhỏ (< 0.01 USDT). Dừng.");
      process.exit(0);
    }

    console.log("USDT trong contract:", ethers.formatUnits(balance, 6));

    const tx = await contract.withdrawUSDT(balance);
    console.log("Tx hash:", tx.hash);
    await tx.wait();

    console.log("Rút thành công:", tx.hash);
    fs.writeFileSync(filePath, today); // Cập nhật ngày rút
    process.exit(0);
  } catch (err) {
    console.error("Lỗi khi rút:", err);
    process.exit(1);
  }
})();

