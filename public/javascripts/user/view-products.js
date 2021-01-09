
function closemodal(id) {

    $('#' + id).modal('hide')
}
function addToCart(proId, catID, storeId) {

    let form = { storeId: storeId }
    let store = { storeId: storeId }
    $.ajax({
        url: '/check-status-cart',
        method: 'POST',
        data: form,
        success: (data) => {
            if (data.otherStoresFound == true && data.sameStoreFound == true) {
                document.getElementById('id01').style.display = 'block';
                console.log("same store and other store found")
                //(... rest of your JS code)
                $('#b' + proId).trigger('click');
                $('body').addClass('modal-close');

            }
            else if (data.otherStoresFound == false && data.sameStoreFound == true) {
                console.log("same store only found")
                $.ajax({
                    url: '/view-products/add-to-cart/' + proId,
                    method: 'POST',
                    data: store,
                    success: (response) => {
                        if (response.status) {
                            let url = window.location.href;
                            $('#section').load(url+ ' #section')
                            document.getElementById("addToCart").style.display="block";
                            setTimeout(function () {
                                document.getElementById("addToCart").style.display="none";
                            }, 3000);
                        }
                        else {
                            
                            console.log("error")
                        }
                    }
                })
            }
            else if (data.otherStoresFound == true && data.sameStoreFound == false) {
                console.log("other store only found")
                document.getElementById('id01').style.display = 'block';
                $('#cancelclick').click(function () {
                    $('#a' + proId).modal('hide')
                    document.getElementById('id01').style.display = 'none';
                    let url = window.location.href;
                    $('#section').load(url+ ' #section')
                })
                $('#deleteclick').click(function () {
                    let newData = { proId: proId, storeId: storeId }
                    $.ajax({
                        url: '/delete-other-cart-product',
                        method: 'POST',
                        data: newData,
                        success: () => {
                            console.log("deleted other cart products")
                            let url = window.location.href;
                            $('#section').load(url+ ' #section')
                            document.getElementById('id01').style.display='none';
                            document.getElementById("addToCart").style.display="block";
                            setTimeout(function () {
                                document.getElementById("addToCart").style.display="none";
                            }, 3000);
                        },
                        error: () => {
                            console.log("error while deleting;")
                        }
                    })
                })
            }
            else {
                console.log("no store found")
                $.ajax({
                    url: '/view-products/add-to-cart/' + proId,
                    method: 'POST',
                    data: store,
                    success: (response) => {
                        if (response.status) {
                            console.log("success")
                            let url = window.location.href;
                            $('#section').load(url+ ' #section')
                            document.getElementById("addToCart").style.display="block";
                            setTimeout(function () {
                                document.getElementById("addToCart").style.display="none";
                            }, 3000);
                        }
                        else {
                            location.replace('/tempo-login')
                            console.log("error")
                        }
                    }
                })
            }
        },
        error: (data) => {
            console.log(data)
            console.log("other stores has found")
        }
    })

}
function searchFunction() {
    document.getElementById("myDropdown").classList.toggle("show");
}

function filterFunction() {
    var input, filter, ul, li, a, i;
    input = document.getElementById("myInput");
    filter = input.value.toUpperCase();
    div = document.getElementById("myDropdown");
    a = div.getElementsByTagName("a");
    for (i = 0; i < a.length; i++) {
        txtValue = a[i].textContent || a[i].innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            a[i].style.display = "";
        } else {
            a[i].style.display = "none";
        }
    }
}
// Get the modal
var modal = document.getElementById('id01');

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}
function filterSelection(id) {
    console.log(id)
    console.log("clicked")
}
function check(value) {
    console.log("selected ")
    console.log(value)
    document.querySelectorAll('margin').forEach(function (el) {
        el.style.display = 'none';
    });
}