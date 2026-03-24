import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useForm } from '@/hooks';

const INITIAL = { name: '', budget: '' };

function createChangeEvent(name: string, value: string) {
  return { target: { name, value } } as React.ChangeEvent<HTMLInputElement>;
}

function createBlurEvent(name: string, value: string) {
  return { target: { name, value } } as React.FocusEvent<HTMLInputElement>;
}

function createSubmitEvent() {
  return { preventDefault: vi.fn() } as unknown as React.FormEvent;
}

describe('useForm', () => {
  it('initializes with provided values', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues: INITIAL, onSubmit: vi.fn() }),
    );

    expect(result.current.values).toEqual(INITIAL);
    expect(result.current.errors).toEqual({});
    expect(result.current.isDirty).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
  });

  it('handleChange updates the field value', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues: INITIAL, onSubmit: vi.fn() }),
    );

    act(() => {
      result.current.handleChange(createChangeEvent('name', 'Test Campaign'));
    });

    expect(result.current.values.name).toBe('Test Campaign');
  });

  it('handleChange clears existing error for the field', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues: INITIAL, onSubmit: vi.fn() }),
    );

    act(() => {
      result.current.setFieldError('name', 'Required');
    });
    expect(result.current.errors.name).toBe('Required');

    act(() => {
      result.current.handleChange(createChangeEvent('name', 'value'));
    });
    expect(result.current.errors.name).toBeUndefined();
  });

  it('isDirty is true when values differ from initial', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues: INITIAL, onSubmit: vi.fn() }),
    );

    expect(result.current.isDirty).toBe(false);

    act(() => {
      result.current.handleChange(createChangeEvent('name', 'changed'));
    });

    expect(result.current.isDirty).toBe(true);
  });

  it('handleBlur runs field validation', () => {
    const validateField = vi.fn().mockReturnValue('Too short');

    const { result } = renderHook(() =>
      useForm({
        initialValues: INITIAL,
        validateField,
        onSubmit: vi.fn(),
      }),
    );

    act(() => {
      result.current.handleBlur(createBlurEvent('name', 'ab'));
    });

    expect(validateField).toHaveBeenCalledWith('name', 'ab', expect.any(Object));
    expect(result.current.errors.name).toBe('Too short');
  });

  it('handleBlur does nothing without validateField', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues: INITIAL, onSubmit: vi.fn() }),
    );

    act(() => {
      result.current.handleBlur(createBlurEvent('name', 'ab'));
    });

    expect(result.current.errors).toEqual({});
  });

  it('handleSubmit calls onSubmit when no errors', async () => {
    const onSubmit = vi.fn();

    const { result } = renderHook(() =>
      useForm({ initialValues: INITIAL, onSubmit }),
    );

    await act(async () => {
      result.current.handleSubmit(createSubmitEvent());
    });

    expect(onSubmit).toHaveBeenCalledWith(INITIAL);
  });

  it('handleSubmit prevents default', async () => {
    const event = createSubmitEvent();

    const { result } = renderHook(() =>
      useForm({ initialValues: INITIAL, onSubmit: vi.fn() }),
    );

    await act(async () => {
      result.current.handleSubmit(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('handleSubmit blocks when validate returns errors', async () => {
    const onSubmit = vi.fn();
    const validate = vi.fn().mockReturnValue({ name: 'Required' });

    const { result } = renderHook(() =>
      useForm({ initialValues: INITIAL, validate, onSubmit }),
    );

    await act(async () => {
      result.current.handleSubmit(createSubmitEvent());
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(result.current.errors.name).toBe('Required');
  });

  it('reset restores initial values and clears errors', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues: INITIAL, onSubmit: vi.fn() }),
    );

    act(() => {
      result.current.handleChange(createChangeEvent('name', 'changed'));
      result.current.setFieldError('budget', 'Invalid');
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.values).toEqual(INITIAL);
    expect(result.current.errors).toEqual({});
    expect(result.current.isDirty).toBe(false);
  });

  it('setFieldValue updates a specific field', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues: INITIAL, onSubmit: vi.fn() }),
    );

    act(() => {
      result.current.setFieldValue('budget', '100');
    });

    expect(result.current.values.budget).toBe('100');
  });

  it('setFieldError sets and clears field errors', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues: INITIAL, onSubmit: vi.fn() }),
    );

    act(() => {
      result.current.setFieldError('name', 'Required');
    });
    expect(result.current.errors.name).toBe('Required');

    act(() => {
      result.current.setFieldError('name', undefined);
    });
    expect(result.current.errors.name).toBeUndefined();
  });
});
