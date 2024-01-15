while (true) {
const SelectElement1 = document.querySelector('body');
const SelectStyle1 = getComputedStyle(SelectElement1);
const StyleValue1 = String(SelectStyle1.getPropertyValue('--textcolor')).trim();
const SelectElement2 = document.querySelector('body');
const SelectStyle2 = getComputedStyle(SelectElement2);
const StyleValue2 = String(SelectStyle2.getPropertyValue('--bgcolor')).trim();
}