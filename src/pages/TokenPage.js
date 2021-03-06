import "../tailwind.css";
import barbsAbi from "../ABIs/BarbsCoinABI.json";
import kawsAbi from "../ABIs/KawsCoinABI.json";
import { ethers, Contract } from "ethers";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

function TokenPage({ tokenAddress }) {
  const [walletAddress, setWalletAddress] = useState([]);
  const [connected, setConnected] = useState(false);
  const [queryData, setQueryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const provider = new ethers.providers.Web3Provider(window.ethereum);

  const connectWallet = async () => {
    // Check if MetaMask is installed on user's browser
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      console.log(accounts);
      let wallet = accounts[0];
      setWalletAddress(wallet);
      setConnected(true);
    } else {
      alert("Please install Mask");
    }
  };

  const query = async (address) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const networkName = await provider.getNetwork().then((res) => {
        return res.name;
      });

      const chainId = (await provider.getNetwork()).chainId;
      const blockHeight = await provider.getBlockNumber();
      const gasPriceAsGwei = provider.getGasPrice().then((res) => {
        return ethers.utils.formatUnits(res, "gwei");
      });
      const blockInfo = await provider.getBlockWithTransactions(blockHeight);

      const balance = await provider.getBalance(address);
      const formattedBalance = ethers.utils.formatUnits(balance, 18).toString();

      const signer = provider.getSigner();
      const contract = new Contract(tokenAddress, kawsAbi.abi, signer);
      const coinName = await contract.symbol();
      const formattedTokenBalance = ethers.utils.formatUnits(await contract.balanceOf(address), 18).toString();

      const data = {
        networkName,
        chainId,
        blockHeight,
        gasPriceAsGwei,
        blockInfo,
        formattedBalance,
        formattedTokenBalance,
        coinName,
      };
      setQueryData(data);
      setLoading(false);
    } catch (error) {
      return {
        error: error.message,
      };
    }
  };

  const isMetaMaskConnected = async () => {
    const accounts = await provider.listAccounts();
    if (accounts.length > 0) {
      setConnected(true);
      setWalletAddress(accounts[0]);
      return;
    }
    setConnected(false);
  };

  const sendTokens = async (toAddress, amount) => {
    const unformattedAmount = ethers.utils.parseEther(amount);
    amount = unformattedAmount.toString();
    const signer = provider.getSigner();
    const contract = new Contract(tokenAddress, barbsAbi.abi, signer);

    contract.transfer(toAddress, amount).then(
      (transferResult) => {
        alert("Token sent! transaction: " + transferResult.hash);
        console.log(transferResult);
        reset();
      },
      (onRejected) => {
        alert(onRejected.message);
      }
    );
  };

  const onSubmit = async (data) => {
    sendTokens(data.toAddress, data.amount);
  };

  useEffect(() => {
    isMetaMaskConnected();
    if (connected) {
      query(walletAddress);
    }
    setInterval(() => {
      isMetaMaskConnected();
    }, 10000);
  }, [walletAddress, queryData, connected, loading]);

  return (
    <div className="h-screen bg-blue-100">
      <div className="flex justify-center">
        <div className="m-10">
          <div className="bg-white p-10 rounded-lg shadow-lg">
            {connected && queryData !== [] ? (
              <div>
                {loading ? (
                  <div>
                    <h2 className="text-2xl font-bold mb-2 text-gray-800">Loading...</h2>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold mb-2 text-gray-800">Wallet Info</h2>
                    <p className="text-lg my-1 text-gray-700">Block Number: {queryData.blockHeight}</p>
                    <p className="text-lg my-1 text-gray-700">ETH balance: {queryData.formattedBalance}</p>
                    <p className="text-lg my-1 text-gray-700">
                      {queryData.coinName} balance: {queryData.formattedTokenBalance}
                    </p>
                    <p className="text-lg my-1 text-gray-700">Current Network: {queryData.networkName}</p>
                    <form onSubmit={handleSubmit(onSubmit)} className="my-3">
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Send Address</label>
                        <input
                          {...register("toAddress", { required: true, pattern: /^0x[a-fA-F0-9]{40}$/ })}
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          type="text"
                          placeholder="Address"
                        />
                        {errors?.toAddress?.type === "pattern" && <p>Not a valid ethereum address</p>}
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Amount in {queryData.coinName}
                        </label>
                        <input
                          {...register("amount", { required: true })}
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          type="text"
                          placeholder="Amount"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <button
                          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                          type="submit"
                        >
                          Send {queryData.coinName}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid place-items-center">
                <h2 className="text-2xl font-bold m-4 text-gray-800">Please connect your wallet</h2>
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  onClick={connectWallet}
                >
                  Connect Metamask
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TokenPage;
