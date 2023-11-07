export async function getCommandOutput(
  cmd: string,
  args: string[],
  cwd: string,
) {
  // console.debug(`Running command: ${cmd} ${args.join(" ")}`);

  const command = new Deno.Command(cmd, {
    args,
    cwd,
  });

  const { code, stdout, stderr } = await command.output();

  const td = new TextDecoder();
  if (code === 0) {
    return td.decode(stdout);
  } else {
    throw new Error(td.decode(stderr));
  }
}
