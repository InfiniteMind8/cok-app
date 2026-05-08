import { AccessButton } from './access-button'

export function AccessButtonWrapper(props: { userId: string; firstName: string }) {
  return (
    <AccessButton firstName={props.firstName}>
      <input type="hidden" name="userId" value={props.userId} />
    </AccessButton>
  )
}
