define("lolma-us/initializers/ajax",["exports"],function(e){"use strict"
Object.defineProperty(e,"__esModule",{value:!0})
var t=Ember.get,r=function(e){var r=t(this,"fastboot.request.protocol")
if(/^\/\//.test(e.url))e.url=r+e.url
else if(!/^https?:\/\//.test(e.url))try{e.url=r+"//"+t(this,"fastboot.request.host")+e.url}catch(e){throw new Error("You are using Ember Data with no host defined in your adapter. This will attempt to use the host of the FastBoot request, which is not configured for the current host of this request. Please set the hostWhitelist property for in your environment.js. FastBoot Error: "+e.message)}if(!najax)throw new Error("najax does not seem to be defined in your app. Did you override it via `addOrOverrideSandboxGlobals` in the fastboot server?")
najax(e)}
e.default={name:"ajax-service",initialize:function(e){e.register("ajax:node",r,{instantiate:!1}),e.inject("adapter","_ajaxRequest","ajax:node"),e.inject("adapter","fastboot","service:fastboot")}}}),define("lolma-us/initializers/error-handler",["exports"],function(e){"use strict"
Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"error-handler",initialize:function(e){Ember.onerror||(Ember.onerror=function(e){var t="There was an error running your app in fastboot. More info about the error: \n "+(e.stack||e)
Ember.Logger.error(t)})}}}),define("lolma-us/instance-initializers/ember-data-fastboot",["exports"],function(e){"use strict"
function t(e){var t=e.lookup("service:store"),r=e.lookup("service:fastboot").get("shoebox"),o=e.lookup("data-adapter:main").getModelTypes().mapBy("name")
r.put("ember-data-store",{get types(){return o.reduce(function(e,r){try{e[r]=t.peekAll(r).toArray().map(function(e){return e.serialize({includeId:!0})})}catch(e){console.error('ember-data-fastboot: serializer crashed when trying to serialize records of "'+r+'"',e)}return e},{})}})}Object.defineProperty(e,"__esModule",{value:!0}),e.initialize=t,e.default={name:"ember-data-fastboot",initialize:t},console.log("shoebox global")})
