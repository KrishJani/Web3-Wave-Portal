import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from './utils/WavePortal.json';
import CircleLoader from 'react-spinners/CircleLoader';
import Spotify from 'react-spotify-embed'

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");

  const contractAddress = "0xd4F8f4E123d6FAd5dB371141442d1eaae4Caaa0C";

  const contractABI = abi.abi;
  
  const [allWaves, setAllWaves] = useState([]);
  const [totalWaves, setTotalWaves] = useState(0);
  let [loading, setLoading] = useState(false);

  const [url, setUrl] = useState('');
  
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }
      
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        await getAllWaves();
      } else {
        console.log("No authorized account found")
      }

      // Set the total number of waves on init:
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

      let count = await wavePortalContract.getTotalWaves();
      setTotalWaves(count.toNumber());

    } catch (error) {
      console.log(error);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!")
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      consloe.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch(error) {
      console.log(error);
    }
  }
  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        
        console.log("Number of waves..", count.toNumber());
        if (url.includes("spotify")){
        const waveTxn = await wavePortalContract.wave(url);
        setLoading(!loading);
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        setLoading(!loading);
        console.log("Mined -- ", waveTxn.hash);
        window.location.reload();
          
        count = await wavePortalContract.getTotalWaves();
        setTotalWaves(count.toNumber());
        console.log("Total waves: ", totalWaves);
        console.log("Retrieved total wave count...", count.toNumber());
      } else {
          alert("Please provide a spotify link to your wave..")
      }
      } else {
        console.log("Ethereum object does not exists..");
      }
    } catch (error) {
      console.log(error);
    }
  }

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const waves = await wavePortalContract.getAllWaves();

        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            songLink: wave.songLink
          });
        });

        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }
  
  useEffect(() => {
    checkIfWalletIsConnected();
    let wavePortalContract;

  const onNewWave = (from, timestamp, message) => {
    console.log("NewWave", from, timestamp, message);
    setAllWaves(prevState => [
      ...prevState,
      {
        address: from,
        timestamp: new Date(timestamp * 1000),
        message: message,
      },
    ]);
  };

  if (window.ethereum) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
    wavePortalContract.on("NewWave", onNewWave);
  }

  return () => {
    if (wavePortalContract) {
      wavePortalContract.off("NewWave", onNewWave);
    }
  };
  }, [])
  
  return (
    <div className="mainContainer">
    <div className="totalWaves">Total Number of waves: { totalWaves }</div>
    
      <div className="dataContainer">
       <div className="header">
         🎵 Hello there !!!
        </div>

        <div className="bio">
        Hey guys I'm Krish and I work on blockchain so that's pretty cool, right?
          <br></br>
        This site you are on is my first blockchain project. You can wave at me with your favorite song from Spotify.
          <br></br>
        You might as well earn some ETH if you are lucky :P
        </div> 
        <div className="innerContainer">
        <input type="text" placeholder="Insert Spotify URL here.." 
          className="inputField" onChange={event => setUrl(event.target.value)}/>
          <button className="waveButton" onClick={wave}>
          Wave at me
        </button>
      </div>
       {!currentAccount && (
        <button className="connectButton" onClick={connectWallet}>
        Connect Wallet
        </button>
        )}
      
      {allWaves.map((wave, index) => {
          return (
            <div key={index} className="detailContainer">
              <div>Address: {wave.address}</div>
              {wave.songLink && (
              <Spotify className="spotifyPlayer" wide link={wave.songLink}/>
              )}
            </div>)
        })}
      </div>
    </div>
  );
}
