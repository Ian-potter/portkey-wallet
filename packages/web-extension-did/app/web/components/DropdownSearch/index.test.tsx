import { render, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import DropdownSearch from './index';

describe('DropdownSearch', () => {
  const onChange = jest.fn(),
    onBlur = jest.fn(),
    onFocus = jest.fn(),
    handleSearch = jest.fn();
  let dom: RenderResult<typeof import('@testing-library/dom/types/queries'), HTMLElement, HTMLElement>;
  let input: Element;

  beforeEach(() => {
    dom = render(
      <DropdownSearch
        open={true}
        overlay={<div className="empty-tip">{'There is no search result'}</div>}
        inputProps={{
          onBlur: onBlur,
          onFocus: onFocus,
          onChange: onChange,
          placeholder: 'please input address',
        }}
        wrapperClassName=""
        onPressEnter={handleSearch}
      />,
    );
    input = dom.getByRole('textbox');
  });

  test('There is no search result node in the document', () => {
    expect(dom.getByText('There is no search result')).toBeInTheDocument();
  });

  test('change input value = ELF, the onFocus function is called, and the onChange function is called three times', async () => {
    await userEvent.click(input);
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(input).toHaveFocus();
    await userEvent.type(input, 'ELF');
    expect(input).toHaveValue('ELF');
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  test('click input, then click the other element, and the onBlur function is called', async () => {
    await userEvent.click(input);
    await userEvent.click(dom.getByText('There is no search result'));
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  test('search input value, and handleSearch function is called', async () => {
    await userEvent.click(input);
    await userEvent.keyboard('{Enter}');
    expect(handleSearch).toHaveBeenCalledTimes(1);
  });
});
