/**
 * Created by laice on 5/4/15.
 */

window.ifp = window.ifp || {};

ifp.legit = function(someVar) {
    if(typeof someVar === 'undefined'){
        return false;
    } else {
        if(someVar != null){
            return true;
        } else {
            return false;
        }
    }
}