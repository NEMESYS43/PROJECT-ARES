var codeDumpPostDialog =   `
<button onclick="clearDialogs()" class="mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab">
  <i class="material-icons">arrow_back</i>
</button>
<center>
    <h3>Add Post</h3>
</center>
<div class="postDescriptionTextareaContainer">
    <textarea placeholder="Description" id="post-description"></textarea>
</div>
<div class="tag-textbox-container">
    <input id="post-tags" type="text" placeholder="tags"></input>
</div>
<input type="button" onclick="postCodeDump()" class="submit-post-button" value="post"></input>`

var exploitPostDialog =   `
<button onclick="clearDialogs()" class="mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab">
  <i class="material-icons">arrow_back</i>
</button>
<center>
    <h3>Add Post</h3>
</center>
<div class="postDescriptionTextareaContainer">
    <textarea placeholder="Description" id="post-description"></textarea>
</div>
<div class="tag-textbox-container">
    <input id="post-tags" type="text" placeholder="tags"></input>
</div>
<input type="button" onclick="postExploit()" class="submit-post-button" value="post"></input>`


function newDialog(title, body, onclick,blur, darken, isRaw, size){
    $('.dialog').removeClass('hide')
    $('.dialog').addClass('show')
    if(size == 'smolBoy'){
        $('.dialog').addClass('smol-boy')
    }
    if(blur == true){
        $('.page-content').addClass('blur')
    }
    if(darken == true){
        $('.page-content').addClass('darken')
    }
    if(size == 'bigBoy'){
        $('.dialog').addClass('big-boy')
    }
    if (isRaw  != false){
        //means the user is passing raw html all the way through
        $('.dialog').append(isRaw)
    }else{
        $('.dialog').append('<center><h1>'+title+'</h1></center><p>'+body+'<p>')
    }
}
function clearDialogs(){
    $('.dialog').removeClass('show')
    $('.dialog').addClass('hide')
    $('.dialog').empty()
    $('.page-content').removeClass('blur')
}





