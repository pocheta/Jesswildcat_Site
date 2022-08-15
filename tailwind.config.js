module.exports = {
  content: ["./public/**/*.{html,js}", "./node_modules/tw-elements/dist/js/**/*.js", "./node_modules/flowbite/**/*.js"],
  theme: {
    extend: {
      height: {
        '10/100': '10%',
      }
    },
  },
  plugins: [
    require('tw-elements/dist/plugin'),
    require('flowbite/plugin')
  ]
};
