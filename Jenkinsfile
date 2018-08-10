node {



   docker.withRegistry('https://registry.hub.docker.com', 'Docker-Hub-Credentials') {
        image = docker.image('doichain/node-only')
        image.pull()
   }

/*
  def runCmd = { cmd,port, rpc_port ->
        docker.image("doichain/node-only").withRun("--rm --hostname=${cmd} -e REGTEST=true -e RPC_ALLOW_IP=::/0 -p ${port}:18445 -p ${rpc_port}:18443 -e RPC_USER=admin -e RPC_PASSWORD=generated-password -e RPC_HOST=localhost") {
           echo "running inside doichain docker image ${cmd} ${port} ${rpc_port}"
        }
    }
*/
 stage 'Build'
  parallel (
    /*"alice": {
     // runCmd ("alice", 18445,18443)
     docker.image("doichain/node-only").withRun("-u root:root --name=alice -e REGTEST=true -e RPC_ALLOW_IP=::/0 -p 18445:18445 -p 18443:18443") { c ->
                sh './contrib/scripts/check-alice.sh'
               // sh 'while ! lsof -i TCP:18445 | grep LISTEN; do sleep 1; done'
                echo "running with doichain docker image alice"
                //sh 'sleep 600'
                echo "finished alice"
     }

    },
    "bob": {
           docker.image("doichain/node-only").withRun("-u root:root --name=bob -e REGTEST=true -e RPC_ALLOW_IP=::/0 -p 18446:18445 -p 18444:18443") { c ->
                 echo "running with doichain docker image bob"
                 sh 'echo lsof -i TCP:18445 | grep LISTEN'
                 //sh 'sleep 680'
                 echo "finished bob"

            }
    }*/

    "meteor": {
             checkout scm;

               docker.image("doichain/node-only").withRun("-u root:root --name=alice -e REGTEST=true -e RPC_ALLOW_IP=::/0 -p 18445:18445 -p 18443:18332") { c ->
                             sh './contrib/scripts/check-alice.sh'
                            // sh 'while ! lsof -i TCP:18445 | grep LISTEN; do sleep 1; done'
                             echo "running with doichain docker image alice"
                             //sh 'sleep 600'
                             sh 'sudo ./contrib/scripts/meteor-install.sh'
                             sh 'sudo git submodule init;sudo git submodule update;sudo meteor npm install;sudo meteor npm run lint;sudo meteor npm run test-jenkins-mocha'

                             echo "finished alice"
                  }

    }
   // failFast: false
  )

}