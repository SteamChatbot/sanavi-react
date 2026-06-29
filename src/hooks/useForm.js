import { useState } from 'react';

export function useForm(initialValues) {
  const [form, setForm]     = useState(initialValues);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { id, name, value } = e.target;
    const key = name || id;
    setForm(prev   => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '', submit: '' }));
  };

  return { form, setForm, errors, setErrors, handleChange };
}
