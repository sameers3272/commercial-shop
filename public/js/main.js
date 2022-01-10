const backdrop = document.querySelector('.backdrop');
const sideDrawer = document.querySelector('.mobile-nav');
const menuToggle = document.querySelector('#side-menu-toggle');

function backdropClickHandler() {
  backdrop.style.display = 'none';
  sideDrawer.classList.remove('open');
}

function menuToggleClickHandler() {
  backdrop.style.display = 'block';
  sideDrawer.classList.add('open');
}

backdrop.addEventListener('click', backdropClickHandler);
menuToggle.addEventListener('click', menuToggleClickHandler);

// $(document).ready(function () {
//   $('#add-product').click(function () {
//     const csrf = $('#csrf').val();
//     const title = $('#title').val();
//     const price = $('#price').val();
//     const image = $('#image');
//     var myform = document.getElementById("myform");
//     const description = $('#description').val();
 
//     let formData = new FormData(myform);
//     $.post({
//       url: '/admin/add-products',
//       contentType:false,  
//       data: formData,
//       function(data) {
//         // location.replace('http://localhost:3000/admin/products');
//       }
//     })
//   })
// })