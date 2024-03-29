import * as React from 'react';

import { Grid, Header, Message } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

import EnsureAnonymous from '../Routes/EnsureAnonymous';
import * as Forms from '../Forms';

interface Props {
}
interface States {
}

class RegPage extends React.Component<Props, States> {
  render() {
    return (
      <Grid
        textAlign="center"
        style={{ height: '100%' }}
        verticalAlign="middle"
      >
        <Grid.Column style={{ maxWidth: 450 }}>
          <Header as="h2" textAlign="center">
            注册<EnsureAnonymous />
          </Header>
          <Forms.Reg />
          <Message>
            已有账户？<Link to="/login">登入</Link>
          </Message>
        </Grid.Column>
      </Grid>
    );
  }
}

export default RegPage;
