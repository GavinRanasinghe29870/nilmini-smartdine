'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

type ActiveField = 'payment' | 'discount' | 'ageGroupSize';

export default function NilminiHotelPOS() {
  const [paymentAmount, setPaymentAmount] = useState('0.00');
  const [discountAmount, setDiscountAmount] = useState('0.00');
  const [ageGroupSize, setAgeGroupSize] = useState('0');
  const [activeField, setActiveField] = useState<ActiveField>('payment');
  const [ageGroup, setAgeGroup] = useState('School Children');
  const [balance, setBalance] = useState('0.00');

  const [currentTime, setCurrentTime] = useState('');
  const [city, setCity] = useState('Colombo');
  const [weather] = useState('Sunny');
  const [dayType, setDayType] = useState('Work Day');

  const grandTotal = 150.0;

  /* Time & Day */
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString());

      const day = now.getDay();
      setDayType(day === 0 || day === 6 ? 'Holiday' : 'Work Day');
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  /* Keypad Logic */
  const handleKeypadPress = (key: string) => {
    const targetValue =
      activeField === 'payment'
        ? paymentAmount
        : activeField === 'discount'
          ? discountAmount
          : ageGroupSize;


    let newValue = targetValue === '0.00' || targetValue === '0' ? '' : targetValue;

    if (key === 'C') {
      newValue = activeField === 'ageGroupSize' ? '0' : '0.00';
    } else if (key === 'ENTER') {
      if (activeField === 'ageGroupSize') {
        setAgeGroupSize(newValue || '0');
      } else {
        newValue = parseFloat(newValue || '0').toFixed(2);

        if (activeField === 'discount') {
          setDiscountAmount(newValue);
          setActiveField('payment');
        } else {
          setPaymentAmount(newValue);
          const balanceValue =
            parseFloat(newValue) - (grandTotal - parseFloat(discountAmount));
          setBalance(balanceValue.toFixed(2));
        }
      }
      return;
    } else {
      if (activeField !== 'ageGroupSize') {
        if (key === '.' && newValue.includes('.')) return;
        newValue += key;

        if (newValue.includes('.')) {
          const [, dec] = newValue.split('.');
          if (dec.length > 2) return;
        }
      } else {
        if (key === '.') return;
        newValue += key;
      }
    }

    if (activeField === 'payment') setPaymentAmount(newValue);
    else if (activeField === 'discount') setDiscountAmount(newValue);
    else setAgeGroupSize(newValue);
  };

  /* UI */
  return (
    <div className="bg-bg-1 text-foreground font-poppins min-h-screen flex flex-col items-center p-8 gap-6">
      <h1 className="text-big-heading text-3d-purple font-bold text-center">
        NILMINI <span className="text-secondary">HOTEL</span>
      </h1>

      {/* Order Info Bar */}
      <div className="w-full max-w-4xl bg-bg-2 rounded-lg p-4 flex flex-wrap justify-between gap-2 text-paragraph">
        <span>{currentTime}</span>
        <span>City: {city}</span>
        <span>Weather: {weather}</span>
        <span>{dayType}</span>
        <span className="font-semibold">Order #: 1120</span>
      </div>

      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-6">
        {/* LEFT */}
        <div className="flex-1 bg-bg-2 rounded-lg p-4 flex flex-col gap-4">
          <table className="w-full border-separate border-spacing-y-2 text-lg">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Each(LKR)</th>
                <th>Total(LKR)</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2].map((i) => (
                <tr key={i} className="bg-bg-1">
                  <td className="flex items-center gap-2 p-2">
                    <div className="relative w-12 h-12 border-2 border-dashed">
                      <Image src="/AddImage.png" alt="Egg Rotti" fill />
                    </div>
                    Egg Rotti
                  </td>
                  <td>1</td>
                  <td>150.00</td>
                  <td>150.00</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="bg-primary rounded-lg p-4 flex flex-col gap-3">
            <div className="flex justify-between">
              <span>Sub Total</span>
              <span>{grandTotal.toFixed(2)}</span>
            </div>

            {/* Discount */}
            <SelectableRow
              label="Discount (LKR)"
              value={discountAmount}
              active={activeField === 'discount'}
              onClick={() => setActiveField('discount')}
            />

            <div className="flex justify-between font-semibold">
              <span>Grand Total</span>
              <span>{grandTotal.toFixed(2)}</span>
            </div>

            {/* Payment */}
            <SelectableRow
              label="Payment Amount (LKR)"
              value={paymentAmount}
              active={activeField === 'payment'}
              onClick={() => setActiveField('payment')}
            />

            <div className="flex justify-between">
              <span>Balance</span>
              <span>{balance}</span>
            </div>

            {/* Age Group */}
            <div className="flex justify-between">
              <span>Customer Age Group</span>
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                className="bg-secondary rounded px-2"
              >
                <option>School Children</option>
                <option>Adults</option>
                <option>Senior Citizens</option>
              </select>
            </div>

            {/* Age Group Size */}
            <SelectableRow
              label="Customer Age Group Size"
              value={ageGroupSize}
              active={activeField === 'ageGroupSize'}
              onClick={() => setActiveField('ageGroupSize')}
            />

            <button className="bg-button text-white py-2 rounded">
              Confirm Order
            </button>
          </div>
        </div>

        {/* RIGHT KEYPAD */}
        <div className="w-full md:w-64 flex flex-col gap-4">
          <input
            readOnly
            value={
              activeField === 'payment'
                ? paymentAmount
                : activeField === 'discount'
                  ? discountAmount
                  : ageGroupSize
            }
            className="bg-bg-2 p-3 text-center font-bold text-xl"
          />

          <div className="grid grid-cols-3 gap-2">
            {['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', '.'].map((k) => (
              <button key={k} onClick={() => handleKeypadPress(k)} className="bg-primary py-4">
                {k}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleKeypadPress('ENTER')}
            className="bg-secondary py-4 font-bold"
          >
            ENTER
          </button>
        </div>
      </div>
    </div>
  );
}

/* Reusable Selectable Row */
function SelectableRow({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex justify-between p-2 cursor-pointer rounded ${active ? 'bg-secondary/40 border-2 border-secondary' : 'bg-bg-2'
        }`}
    >
      <span>{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
