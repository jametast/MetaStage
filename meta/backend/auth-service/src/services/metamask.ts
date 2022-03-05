import detectEthereumProvider from '@metamask/detect-provider';
import { ethers } from "ethers";
import React, { useState } from "react";


declare let window: any;

const provider = async () => {
    return await detectEthereumProvider();
}
const [errorMessage, setErrorMessage] = useState(null);

const connectWalletHandler = async () => {
    if (window.ethereum) {
        window.ethereum.request({method: 'request_ethAccounts'})
        .then((result: any) => {
            accountChangeHandler(result[0]);
            setConnButtonText('Wallet connected');
        });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send('eth_requestAccounts', []);
        const signer = provider.getSigner();
    } else {
        setErrorMessage("Need to install MetaMask");
    }
};


const accountChangeHandler = (newAccount: any) => {
    setDefaultAccount(newAccount);
}


