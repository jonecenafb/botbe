require('dotenv').config();
const { ethers } = require('ethers');

(async () => {
  const RPC_URL = process.env.PROVIDER_URL_URL;
  let PRIVATE_KEY = process.env.PRIVATE_KEY;
  if (!PRIVATE_KEY.startsWith('0x')) {
    PRIVATE_KEY = '0x' + PRIVATE_KEY;
  }
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
  const USDT_ADDRESS = process.env.USDT_ADDRESS;
  // kiểm tra đủ env, nếu thiếu thì exit(1)
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS,
    ["function withdrawUSDT(uint256 amount) external"], wallet);
  const usdt = new ethers.Contract(USDT_ADDRESS,
    ["function balanceOf(address) view returns (uint256)"], provider);
  try {
    const balance = await usdt.balanceOf(CONTRACT_ADDRESS);
    if (balance === 0n) {
      console.log('Không có USDT để rút.');
      process.exit(0);
    }
    console.log('Balance:', balance.toString());
    const tx = await contract.withdrawUSDT(balance);
    console.log('Tx hash:', tx.hash);
    await tx.wait();
    console.log('Rút thành công:', tx.hash);
    process.exit(0);
  } catch (err) {
    console.error('Lỗi khi rút:', err);
    process.exit(1);
  }
})();
