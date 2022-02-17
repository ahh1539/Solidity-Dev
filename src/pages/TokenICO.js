import "../tailwind.css";
import kawsAbi from "../ABIs/KawsCoinABI.json";
import { ethers, Contract, BigNumber } from "ethers";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const exampleContractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

function TokenICO() {
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

  const isMetaMaskConnected = async () => {
    const accounts = await provider.listAccounts();
    if (accounts.length > 0) {
      setConnected(true);
      setWalletAddress(accounts[0]);
      return;
    }
    setConnected(false);
  };

  const query = async (address) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const networkName = await provider.getNetwork().then((res) => {
        return res.name;
      });

      const ethBalance = ethers.utils.formatUnits(await provider.getBalance(address), 18).toString();

      const signer = provider.getSigner();
      const contract = new Contract(exampleContractAddress, kawsAbi.abi, signer);
      const contractFounder = await contract.founder();
      const coinName = await contract.symbol();
      const ownerBarbsBalance = ethers.utils.formatUnits(await contract.balanceOf(contractFounder), 18).toString();
      const tokenPerEth = ethers.utils.formatUnits(await contract.barbEthMultiplier(), 0).toString();

      const data = {
        networkName,
        ethBalance,
        ownerBarbsBalance,
        coinName,
        contractFounder,
        tokenPerEth,
      };
      setQueryData(data);
      setLoading(false);
    } catch (error) {
      return {
        error: error.message,
      };
    }
  };

  const buyToken = async (amount) => {
    console.log(amount);
    const unformattedAmount = ethers.utils.parseEther(amount);
    const signer = provider.getSigner();
    const contract = new Contract(exampleContractAddress, kawsAbi.abi, signer);
    let overrides = {
      // The amount to send with the transaction (i.e. msg.value)
      value: unformattedAmount,
    };
    contract.invest(overrides).then(
      (transferResult) => {
        alert("Purchase sent!: " + transferResult.hash);
        reset();
      },
      (onRejected) => {
        alert(onRejected.message);
      }
    );
  };

  const onSubmit = async (data) => {
    console.log(data);
    buyToken(data.amount);
  };

  useEffect(() => {
    isMetaMaskConnected();
    if (connected) {
      query(walletAddress);
    }
    setInterval(() => {
      isMetaMaskConnected();
    }, 3000);
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
                    <h2 className="text-2xl font-bold mb-2 text-gray-800">Purchase {queryData.coinName}</h2>
                    <p className="text-lg my-1 text-gray-700">ETH balance: {queryData.ethBalance}</p>
                    <p className="text-lg my-1 text-gray-700">
                      {queryData.coinName} remaining: {queryData.ownerBarbsBalance}
                    </p>
                    <p className="text-lg my-1 text-gray-700">
                      {queryData.coinName} per ETH: {queryData.tokenPerEth}
                    </p>
                    <p className="text-lg my-1 text-gray-700">Current Network: {queryData.networkName}</p>
                    <form onSubmit={handleSubmit(onSubmit)} className="my-3">
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Purchase amount in ETH</label>
                        <input
                          {...register("amount", { required: true })}
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          type="text"
                          placeholder="ETH amount"
                        />
                        {errors?.amount && <p>This is required!</p>}
                      </div>
                      <div className="flex items-center justify-between">
                        <button
                          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                          type="submit"
                        >
                          Purchase {queryData.coinName}
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

export default TokenICO;