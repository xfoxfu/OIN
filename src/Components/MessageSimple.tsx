import * as React from 'react';
import { inject, observer } from 'mobx-react';
import SessionState from '../lib/SessionStore';

import { Card, Button, ButtonProps } from 'semantic-ui-react';

interface Props {
  session?: SessionState;
  id: string;
  title: string;
  subscription: string;
  summary: string;
  onClick: (id: string) => void;
  onMarkedAsReaded?: () => void;
}
interface States {
  loading: boolean;
}

@inject('session')
@observer
class MessageSimple extends React.PureComponent<Props, States> {
  onClick: ButtonProps['onClick'] = () => {
    this.props.onClick(this.props.id);
  }
  markAsRead = async () => {
    this.setState({ loading: true });
    await this.props.session!.markAsReaded(this.props.id);
    this.setState({ loading: false });
    if (this.props.onMarkedAsReaded) { this.props.onMarkedAsReaded(); }
  }
  render() {
    const { title, subscription, summary } = this.props;
    return (
      <Card fluid>
        <Card.Content>
          <Card.Header>{title}</Card.Header>
          <Card.Meta>{subscription}</Card.Meta>
          <Card.Description>
            {summary}
          </Card.Description>
        </Card.Content>
        <Card.Content>
          <Button onClick={this.markAsRead} color="olive" content="标为已读" size="mini" />
          <Button onClick={this.onClick} color="blue" content="查看详情" size="mini" />
        </Card.Content>
      </Card>
    );
  }
}

export default MessageSimple;
