# ANNOUNCEMENT

Hey,

we are currently reorganzing our code during the EU Hackathon #EuVsVirus.
For this we move code fragments part by part from the former repository at:
https://github.com/delude88/digitalstage-mediasoup

And we need your Help!

So we add some comments like

    //TODO: Implement this feature here
    
as single work packets for the communicty.

We will use this readme for updates in the upcoming week during the hackatlon.
And join us on the #EuVsVirus channel:

https://euvsvirus.slack.com/archives/C011PTXA9U7

and get in contact :)

Together we fight corona!

# Digital Stage Web Client

This is the web client implementation of the Digital Stage Project, written in Typescript and using mainly
 - React
 - Next.js
 - Socket.io
 - Mediasoup
 - Google Firebase
 - Base Web UI Framework
 
 Please participante and help us developing this solution right now at
 
    #WirVsVirus
     
    #EUvsVirus

# Live

This repository is currently deployed here:

https://digitalstage.now.sh/login



# Install

To get started, checkout the repository and install all dependencies first:

    git clone https://github.com/digital-stage/webclient.git
    cd webclient
    npm install
    
Then you can start the client by using

    npm run prod
    

Then open a modern browser (we recommend Google Chrome) and open

    http://localhost:3000/

## Using a local digital stage server instance

When you want to use a local instance of the digital stage server (https://github.com/digital-stage/server.git), use the following command instead

    npm dev
    
and make sure, that the server instance is running on port 3001.

### Google Chrome hints
Google Chrome will restrict the connection to the server, since we are using self-signed SSL certificates, so enable the usage of insecure localhost,
by opening the following link inside Google Chrome and enable the flag "allow insecure localhost":

    chrome://flags/#allow-insecure-localhost
    
### Firefox hints
If you are using e.g. Firefox instead, navigate to the following page:

    https://localhost:3001
    
Then a warning page should appear. Continue by accepting the insecure certificate. This will create an exception for localhost:3001 and thus the client application should work.
