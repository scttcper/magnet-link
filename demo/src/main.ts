// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Buffer } from 'buffer';
import { magnetDecode, magnetEncode } from '../../src';

(window as any).magnetDecode = magnetDecode;
(window as any).magnetEncode = magnetEncode;

const input = document.querySelector<HTMLInputElement>('#input');
const output = document.querySelector<HTMLInputElement>('#output');

input.addEventListener('input', event => inputChange((event.target as HTMLInputElement).value));
output.addEventListener('input', event => outputChange((event.target as HTMLInputElement).value));

function inputChange(str: string) {
  output.value = JSON.stringify(magnetDecode(str), null, 4);
}

function outputChange(str: string) {
  input.value = magnetEncode(JSON.parse(str));
}

