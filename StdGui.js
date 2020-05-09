var displaySize; 
var stackTable;
var commandInput;
var curDirDisp;
var historyLines = [];
var maxHistorySize = 30;
var curHistoryIdx = -1;

calculator.init(new org.eldanb.mecalc.calclib.filesys.Directory("HOME"));

calculator.stack.addListener({
    stackUpdateSplice : function(sender, start,len,vals) { 
//showStack(sender); 
},
    stackUpdateComplete : function(sender) { 
//showStack(sender); 
}
});


function asyncUpdateLoginStatusUpdate()
{
try
{
   var xhr = new XMLHttpRequest();
   xhr.open("GET", "login_status", true);
   xhr.onreadystatechange = function() {
alert(xhr.readyState);
       var loggedin=false;
       if ( xhr.readyState == 4 ) {
             if ( xhr.status == 200 ) {
alert("Resl: " + xhr.responseText);
                  document.all("loggedIn").style.display="block";
                  document.all("loggedOut").style.display="hidden";
                  document.all("loggedInName").innerText = xhr.responseText;
                  loggedin = true;
             }
       }
       if(!loggedin)
       {
           document.all("loggedIn").style.display="hidden";
           document.all("loggedOut").style.display="block";
       }
   }
                  
   xhr.send(null);
} catch(e)
{
alert(e);
}
}

function initStackDisplay()
{
    stackTable = document.all("stackTable");

    var trs;
    trs = stackTable.getElementsByTagName("tr");

    displaySize = trs.length;
}

function initButtons()
{
   var lDivs = document.getElementsByTagName("div");
   for(var lIdx=0; lIdx<lDivs.length; lIdx++)
   {
      var lElem = lDivs.item(lIdx);
      if(lElem.className=="btn" && lElem.id)
      {
          var lEvalCmdName = lElem.id;
          var objRef = calculator.parser.parseObjectReference(lEvalCmdName);
          if(objRef) {
              var lEvalObj = calculator.parser.parseObjectReference(lEvalCmdName).obj;
       
              var lBtnDesc = lEvalCmdName;
              if(lEvalObj.docString)
              {
                  lBtnDesc += ": " + lEvalObj.docString;
              }
              
              lElem.title = lBtnDesc;
          } else {
              lElem.style = "display: none";
          }
      }
   }
}

function showStack(s)
{      
   var lStackSize = s.size(); 
   var lStackRows = stackTable.getElementsByTagName("tr");
   for(var idx=1; idx<=displaySize; idx++)
   {
      displayRow = lStackRows.item(displaySize-idx);
      displayRow.getElementsByTagName("td").item(1).innerHTML = idx<=lStackSize?s.item(idx).stackDisplayString():"-";
   }
}

function updateDirDisp()
{
   var lDir = calculator.currentDir;
   var lDirPath = "";

   while(lDir)
   {
       lDirPath = "/" + lDir.name + lDirPath;
       lDir=lDir.parent;
   }
      
   curDirDisp.innerHTML = lDirPath;
}

calculator.addListener({
   notifyChangeDir : function(aSender, aDir)
   {
       updateDirDisp();
   },
   notifyFsChange : function(aSender, aOp, aDir, aId, aObj)
   {
   }

});


function processCommand(aCmd)
{
    calculator.processCommandLine(aCmd).then(
        () => {
            showStack(calculator.stack);
        },
        (e) => {
            showStack(calculator.stack);
            showError(e.toString());
        });    
}

function showError(aMsg)
{
    errorDisplay.innerText = aMsg;
    errorDisplay.textContent = aMsg;
    errorDisplay.style.display = 'block';
    commandInput.style.display = 'none';
    window.setTimeout(function () { errorDisplay.focus(); }, 0);
}

function dismissError()
{
    commandInput.style.display = 'block';
    errorDisplay.style.display = 'none';
    window.setTimeout(function () { commandInput.focus(); }, 0);
}

function historyNavigate(aDir)
{
   if(!historyLines.length)
       return;

   curHistoryIdx += aDir;
   if(curHistoryIdx<0) 
      curHistoryIdx = historyLines.length-1;
   if(curHistoryIdx>=historyLines.length) 
      curHistoryIdx = 0;

   commandInput.value = historyLines[curHistoryIdx];
}

function processInputCommand()
{
   var lCmdTxt;
   var lCmdOb;

   lCmdTxt = commandInput.value;

   if(lCmdTxt)
   {                                                 
       historyLines.push(lCmdTxt);
       if(historyLines.length>maxHistorySize)
       {
           historyLines.splice(0,historyLines.length-maxHistorySize);
       }
     
      processCommand(lCmdTxt);

      commandInput.value="";
      curHistoryIdx = -1;
   }

   commandInput.focus();
}

function editStackObject()
{
   var lObj = calculator.stack.item(1);
   if(commandInput.value == "" && lObj.unparse)
   {
       calculator.stack.pop();
       showStack(calculator.stack);
       commandInput.value = lObj.unparse();
       commandInput.focus();
   }
}

function processCmdLineKeyDown(evt)
{
   if(!evt) evt=window.event;

   if(evt.keyCode == 13)
   {
      processInputCommand();
      evt.returnValue = false;
      evt.cancelBubble = true;
      evt.cancel=true;
      if(evt.stopPropagation) evt.stopPropagation();
      if(evt.preventDefault) evt.preventDefault();
      return false;
   } else
   if(evt.keyCode == 38 && !evt.shiftKey)
   {
      historyNavigate(-1);
      evt.returnValue = false;
      evt.cancelBubble = true;
      evt.cancel=true;
      if(evt.stopPropagation) evt.stopPropagation();
      if(evt.preventDefault) evt.preventDefault();
      return false;
   } else
   if(evt.keyCode == 40)
   {
      historyNavigate(1);
      evt.returnValue = false;
      evt.cancelBubble = true;
      evt.cancel=true;
      if(evt.stopPropagation) evt.stopPropagation();
      if(evt.preventDefault) evt.preventDefault();
      return false;
   } else
   if(evt.keyCode == 38 && evt.shiftKey)
   {
      editStackObject();
      evt.returnValue = false;
      evt.cancelBubble = true;
      evt.cancel=true;
      if(evt.stopPropagation) evt.stopPropagation();
      if(evt.preventDefault) evt.preventDefault();
      return false;
   } 

   return true;
}


function sebClk(evt)
{
   processInputCommand();

   var btn;
   btn = evt.srcElement;
   if(!btn) btn = evt.target;
   while(btn && btn.tagName!='DIV') btn=btn.parentNode;
                                  
   processCommand(btn.id);
   commandInput.focus();
}

function btdHov(evt)
{
   if(!evt) evt=window.event;
   var btn;                                                                     
   btn = evt.srcElement;
   if(!btn) btn = evt.target;
   while(btn && btn.tagName!='DIV') btn=btn.parentNode;
   btn.className="btnHover";
}

function btdOut(evt)
{
   if(!evt) evt=window.event;
   var btn;                                                                     
   btn = evt.srcElement;
   if(!btn) btn = evt.target;
   while(btn && btn.tagName!='DIV') btn=btn.parentNode;
   btn.className="btn";
}

function onCalcLoaded()
{
//   asyncUpdateLoginStatusUpdate();
   commandInput.focus();
}
