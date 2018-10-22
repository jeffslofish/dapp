import {chai} from 'meteor/practicalmeteor:chai';
import {
    generatetoaddress, getBalance, getNewAddress,
    importPrivKey,
    isNodeAlive,
    isNodeAliveAndConnectedToHost
} from "./test-api/test-api-on-node";
import {
    fetchConfirmLinkFromPop3Mail,
    getNameIdOfOptIn,
    login,confirmLink,
    requestDOI, verifyDOI, createUser, findUser, findOptIn, exportOptIns
} from "./test-api/test-api-on-dapp";
import {logBlockchain} from "../imports/startup/server/log-configuration";

const node_url_alice = 'http://172.20.0.6:18332/';
const node_url_bob =   'http://172.20.0.7:18332/';
const auth = "admin:generated-password";
const privKeyBob = "cP3EigkzsWuyKEmxk8cC6qXYb4ZjwUo5vzvZpAPmDQ83RCgXQruj";

const dappUrlAlice = "http://localhost:3000";
const dappUrlBob = "http://172.20.0.8:4000";
const dAppLogin = {"username":"admin","password":"password"};
const aliceALogin = {"username":"alice-a","password":"password"};

const recipient_mail = "bob@ci-doichain.org";
const sender_mail  = "alice@ci-doichain.org";
const log = true;
const templateUrlA="http://templateUrlB.com";
const templateUrlB="http://templateUrlB.com";
let aliceAddress;

describe('basic-doi-test', function () {
    this.timeout(120000);

    it('should create a RegTest Doichain with alice and bob and some Doi - coins', function (done) {
        //connect nodes (alice & bob) and generate DOI
        isNodeAlive(node_url_alice,auth,false);
        isNodeAliveAndConnectedToHost(node_url_bob,auth,'alice',false);
        importPrivKey(node_url_bob,auth,privKeyBob,true,false);

        aliceAddress = getNewAddress(node_url_alice,auth,false);
        generatetoaddress(node_url_alice,auth, aliceAddress,110);  //110 blocks to new address! 110 blöcke *25 coins

        const aliceBalance = getBalance(node_url_alice,auth,log);
        chai.assert.isAbove(aliceBalance, 0, 'no funding! ');
        done();
    });

    it('should test if basic Doichain workflow is working with data', function (done) {
        requestConfirmVerifyBasicDoi(null,done);
    });

    it('should test if basic Doichain workflow is working without optional data', function (done) {
        requestConfirmVerifyBasicDoi({'city':'Ekaterinburg'},done);
    });
;
    it('should test if Doichain workflow is using different templates for different users', function (done) {
        const logAdmin = login(dappUrlAlice,dAppLogin,false);
        let userA = createUser(dappUrlAlice,logAdmin,"alice-a",templateUrlA);
        chai.expect(findUser(userA)).to.not.be.undefined;
        let userB = createUser(dappUrlAlice,logAdmin,"alice-b",templateUrlB);
        chai.expect(findUser(userB)).to.not.be.undefined;
        const logUserA = login(dappUrlAlice,aliceALogin,false);
        const resultDataOptIn = requestDOI(dappUrlAlice,logUserA,recipient_mail,sender_mail,false);
        chai.expect(findOptIn(resultDataOptIn._id)).to.not.be.undefined;
        

        //login as admin
        //create two users alice-a and alice-b with two different template urls
        //login as user alice-a and request DOI - bob

        done();
    });
    it('should test if users can export OptIns ', function (done) {
        const logAdmin = login(dappUrlAlice,dAppLogin,false);
        const logUserA = login(dappUrlAlice,aliceALogin,false);
        const exportedOptIns = exportOptIns(dappUrlAlice,logAdmin);
        chai.expect(exportedOptIns).to.not.be.undefined;
        chai.expect(exportedOptIns[0]).to.not.be.undefined;
        const exportedOptInsA = exportOptIns(dappUrlAlice,logUserA);
        for(let optIn in exportedOptInsA){
            chai.expect(optIn.ownerId).to.be.equal(logUserA.userId);
        }
        //chai.expect(findOptIn(resultDataOptIn._id)).to.not.be.undefined;
        

        //login as admin
        //create two users alice-a and alice-b with two different template urls
        //login as user alice-a and request DOI - bob

        done();
    });


    function requestConfirmVerifyBasicDoi(optionalData,done){
        //login to dApp & request DOI on alice via bob
        const dataLoginAlice = login(dappUrlAlice,dAppLogin,false); //log into dApp
        const resultDataOptIn = requestDOI(dappUrlAlice,dataLoginAlice,recipient_mail,sender_mail,optionalData,false);
        generatetoaddress(node_url_alice,auth, aliceAddress,1,false); //TODO this should be not necessary(!) but with out we have an error when fetching the transaction

        if(log) logBlockchain('waiting seconds before get NameIdOfOptIn',10);
        setTimeout(Meteor.bindEnvironment(function () {

            const nameId = getNameIdOfOptIn(node_url_alice,auth,resultDataOptIn.data.id,true);
            chai.expect(nameId).to.not.be.null;

            if(log) logBlockchain('waiting seconds before fetching email:',10);
            setTimeout(Meteor.bindEnvironment(function () {

                const link2Confirm= fetchConfirmLinkFromPop3Mail("mail",110,"bob@ci-doichain.org","bob",dappUrlBob,false);
                chai.expect(link2Confirm).to.not.be.null;
                confirmLink(link2Confirm);
                generatetoaddress(node_url_alice,auth, aliceAddress,1,false);
                if(log) logBlockchain('waiting 10 seconds to update blockchain before generating another block:');
                setTimeout(Meteor.bindEnvironment(function () {
                    generatetoaddress(node_url_alice,auth, aliceAddress,1,false);

                    if(log) logBlockchain('waiting 10 seconds before verifying DOI on alice:');
                    setTimeout(Meteor.bindEnvironment(function () {
                        //need to generate two blocks to make block visible on alice
                        verifyDOI(dappUrlAlice, sender_mail, recipient_mail,nameId, dataLoginAlice, log );
                        done();
                    }),10000); //verify
                }),10000); //verify
            }),10000); //connect to pop3
        }),10000); //find transaction on bob's node - even the block is not confirmed yet
    }
});