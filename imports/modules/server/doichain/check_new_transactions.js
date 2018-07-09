import { Meteor } from 'meteor/meteor';
import { listSinceBlock, getRawTransaction} from '../../../../server/api/doichain.js';
import { CONFIRM_CLIENT, CONFIRM_ADDRESS } from '../../../startup/server/doichain-configuration.js';
import addDoichainEntry from './add_entry_and_fetch_data.js'
import {isDebug} from "../../../startup/server/dapp-configuration";
import { Meta } from '../../../api/meta/meta.js';
import addOrUpdateMeta from '../meta/addOrUpdate.js';
import {logConfirm} from "../../../startup/server/log-configuration";

const TX_NAME_START = "e/";
const LAST_CHECKED_BLOCK_KEY = "lastCheckedBlock";

const checkNewTransaction = (txid) => {
  try {
      if(!txid){
          logConfirm("checkNewTransaction triggered when starting node - checking all transactions since last check for doichain address",CONFIRM_ADDRESS);

          try {
              var lastCheckedBlock = Meta.findOne({key: LAST_CHECKED_BLOCK_KEY});
              if(lastCheckedBlock !== undefined) lastCheckedBlock = lastCheckedBlock.value;
              logConfirm("lastCheckedBlock",lastCheckedBlock);
              const ret = listSinceBlock(CONFIRM_CLIENT, lastCheckedBlock);
              if(ret === undefined || ret.transactions === undefined) return;
              logConfirm("listSinceBlock",ret);
              const txs = ret.transactions;
              lastCheckedBlock = ret.lastblock;

              if(!ret || !txs || !txs.length===0){
                  logConfirm("transactions do not contain nameOp transaction details or transaction not found.", lastCheckedBlock);
                  addOrUpdateMeta({key: LAST_CHECKED_BLOCK_KEY, value: lastCheckedBlock});
                  return;
              }
          const addressTxs = txs.filter(tx =>
              tx.scriptPubKey.nameOp !== undefined
	      && tx.scriptPubKey.nameOp.op === "name_doi"
              && tx.scriptPubKey.addresses[0] === CONFIRM_ADDRESS
              && tx.scriptPubKey.nameOp.name !== undefined
              && tx.scriptPubKey.nameOp.name.startsWith(TX_NAME_START)
          );
              addressTxs.forEach(tx => addTx(tx));
              addOrUpdateMeta({key: LAST_CHECKED_BLOCK_KEY, value: lastCheckedBlock});
              logConfirm("Transactions updated","");
          } catch(exception) {
              throw new Meteor.Error('namecoin.checkNewTransactions.exception', exception);
          }

      }else{

          logConfirm("checking"+txid+" was triggered by walletnotify getting its data from blockchain for doichain address",CONFIRM_ADDRESS);

          const ret = getRawTransaction(CONFIRM_CLIENT, txid);
          const txs = ret.vout;

          if(!ret || !txs || !txs.length===0){
              logConfirm("txid "+txid+' does not contain transaction details or transaction not found.');
              return;
          }
          const addressTxs = txs.filter(tx =>
              tx.scriptPubKey.nameOp !== undefined
	      && tx.scriptPubKey.nameOp.op === "name_doi"
              && tx.scriptPubKey.addresses[0] === CONFIRM_ADDRESS
              && tx.scriptPubKey.nameOp.name !== undefined
              && tx.scriptPubKey.nameOp.name.startsWith(TX_NAME_START)
          );

          logConfirm("last blockhash:", addressTxs);
          addressTxs.forEach(tx => addTx(tx,txid));
          //addOrUpdateMeta({key: LAST_CHECKED_BLOCK_KEY, value: addressTxs[addressTxs.length-1].blockhash});

      }



  } catch(exception) {
    throw new Meteor.Error('doichain.checkNewTransactions.exception', exception);
  }
  return true;
};


function addTx(tx,txid) {

  logConfirm("addTx:",JSON.stringify(tx));
  if(!tx.scriptPubKey || !tx.scriptPubKey.nameOp || !tx.scriptPubKey.nameOp.op) return;

  const txName = tx.scriptPubKey.nameOp.name.substring(TX_NAME_START.length);
  const txValue = tx.scriptPubKey.nameOp.value;
  const txAddress = tx.scriptPubKey.addresses[0]; //a soi entry can only be sent to one address so far.

  addDoichainEntry({
    name: txName,
    value: txValue,
    address: txAddress,
    txId: txid
  });
}

export default checkNewTransaction;
